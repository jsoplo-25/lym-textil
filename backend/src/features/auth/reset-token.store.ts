interface ResetCodeEntry {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

class ResetTokenStore {
  private codes = new Map<string, ResetCodeEntry>();

  /**
   * Save or overwrite a reset code for an email (15 min validity)
   */
  set(email: string, code: string): void {
    const normalized = email.toLowerCase().trim();
    this.codes.set(normalized, {
      email: normalized,
      code: code.trim(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
      attempts: 0,
    });
  }

  /**
   * Check if a code matches and is not expired
   */
  verify(email: string, code: string): { valid: boolean; reason?: string } {
    const normalized = email.toLowerCase().trim();
    const entry = this.codes.get(normalized);

    if (!entry) {
      return { valid: false, reason: 'No hay ninguna solicitud de recuperación activa para este correo.' };
    }

    if (Date.now() > entry.expiresAt) {
      this.codes.delete(normalized);
      return { valid: false, reason: 'El código de verificación ha expirado. Por favor solicita uno nuevo.' };
    }

    entry.attempts += 1;
    if (entry.attempts > 5) {
      this.codes.delete(normalized);
      return { valid: false, reason: 'Has superado el número máximo de intentos. Solicita un nuevo código.' };
    }

    if (entry.code !== code.trim()) {
      return { valid: false, reason: 'El código de verificación ingresado es incorrecto.' };
    }

    return { valid: true };
  }

  /**
   * Remove code once consumed
   */
  delete(email: string): void {
    const normalized = email.toLowerCase().trim();
    this.codes.delete(normalized);
  }
}

export const resetTokenStore = new ResetTokenStore();
