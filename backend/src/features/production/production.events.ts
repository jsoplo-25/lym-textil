import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../../shared/utils/jwt';
import { COOKIE_NAMES } from '../../shared/utils/cookies';

/**
 * Canal de eventos en tiempo real (Server-Sent Events) para el módulo de producción.
 * Cada cambio exitoso (POST/PUT/DELETE) se notifica a todos los clientes conectados
 * para que refresquen su vista sin recargar la página.
 */
const clients = new Set<Response>();

export interface ProductionChangeEvent {
  type: 'production:changed';
  method: string;
  path: string;
  at: number;
}

function publish(event: ProductionChangeEvent): void {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}

/** Middleware: al terminar una mutación exitosa, avisa a los clientes conectados. */
export function broadcastProductionChanges(req: Request, res: Response, next: NextFunction): void {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      publish({ type: 'production:changed', method: req.method, path: req.originalUrl, at: Date.now() });
    }
  });
  next();
}

/** Endpoint SSE: GET /production/stream */
export function productionStream(req: Request, res: Response): void {
  let token: string | null = null;
  if (req.cookies && req.cookies[COOKIE_NAMES.ACCESS_TOKEN]) token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
  if (!token && typeof req.query.token === 'string') token = req.query.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) token = req.headers.authorization.split(' ')[1];

  if (!token) {
    res.status(401).end();
    return;
  }
  try {
    verifyToken(token);
  } catch {
    res.status(401).end();
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  res.write(`: connected\n\n`);

  clients.add(res);
  const ping = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {
      clearInterval(ping);
      clients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    clients.delete(res);
  });
}
