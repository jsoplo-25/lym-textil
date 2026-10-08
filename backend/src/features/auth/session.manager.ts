import { Response } from 'express';

interface SessionData {
  sessionId: string;
  userId: string;
  createdAt: number;
  lastActive: number;
}

type SessionSubscriber = (event: { type: 'SESSION_SUPERSEDED'; newSessionId: string }) => void;

class SessionManager {
  // Mapa de userId -> Sesión activa actual
  private activeSessions = new Map<string, SessionData>();

  // Mapa de userId -> Conjunto de conexiones SSE activas para avisar en tiempo real
  private subscribers = new Map<string, Set<SessionSubscriber>>();

  /**
   * Registra un nuevo inicio de sesión para el usuario.
   * Si ya existía una sesión previa (otro tab u otra PC), notifica inmediatamente a las conexiones previas.
   */
  startSession(userId: string, sessionId: string): void {
    const previous = this.activeSessions.get(userId);

    this.activeSessions.set(userId, {
      sessionId,
      userId,
      createdAt: Date.now(),
      lastActive: Date.now(),
    });

    // Si había una sesión previa distinta, notificamos a los suscriptores para cerrar la anterior en tiempo real
    if (previous && previous.sessionId !== sessionId) {
      this.notifySuperseded(userId, sessionId);
    }
  }

  /**
   * Verifica si la sesión consultada sigue siendo la única sesión activa para este usuario.
   */
  isValidSession(userId: string, sessionId?: string): boolean {
    if (!sessionId) return true; // Retrocompatibilidad si no vino sessionId
    const current = this.activeSessions.get(userId);
    if (!current) {
      // Si el servidor se reinició y la sesión no estaba en memoria, la registramos como activa
      this.activeSessions.set(userId, {
        sessionId,
        userId,
        createdAt: Date.now(),
        lastActive: Date.now(),
      });
      return true;
    }
    return current.sessionId === sessionId;
  }

  /**
   * Actualiza el timestamp de última actividad
   */
  touchSession(userId: string): void {
    const current = this.activeSessions.get(userId);
    if (current) {
      current.lastActive = Date.now();
    }
  }

  /**
   * Cierra manualmente la sesión de un usuario
   */
  endSession(userId: string, sessionId?: string): void {
    const current = this.activeSessions.get(userId);
    if (current && (!sessionId || current.sessionId === sessionId)) {
      this.activeSessions.delete(userId);
    }
  }

  /**
   * Suscribe una conexión HTTP (Server-Sent Events) para recibir eventos de sesión en tiempo real
   */
  subscribe(userId: string, currentSessionId: string, res: Response): () => void {
    let userSubs = this.subscribers.get(userId);
    if (!userSubs) {
      userSubs = new Set();
      this.subscribers.set(userId, userSubs);
    }

    const callback: SessionSubscriber = (event) => {
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch {
        // Conexión cerrada
      }
    };

    userSubs.add(callback);

    // Si la sesión ya fue superada antes de abrir el stream, notificar inmediatamente
    const current = this.activeSessions.get(userId);
    if (current && current.sessionId !== currentSessionId) {
      callback({ type: 'SESSION_SUPERSEDED', newSessionId: current.sessionId });
    }

    return () => {
      userSubs?.delete(callback);
      if (userSubs && userSubs.size === 0) {
        this.subscribers.delete(userId);
      }
    };
  }

  private notifySuperseded(userId: string, newSessionId: string): void {
    const userSubs = this.subscribers.get(userId);
    if (userSubs && userSubs.size > 0) {
      userSubs.forEach((callback) => {
        try {
          callback({ type: 'SESSION_SUPERSEDED', newSessionId });
        } catch {}
      });
    }
  }
}

export const sessionManager = new SessionManager();
