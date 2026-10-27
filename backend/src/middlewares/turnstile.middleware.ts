import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  hostname?: string;
  challengeTs?: string;
}

/**
 * Valida un token de Cloudflare Turnstile contra la API oficial de Cloudflare.
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<TurnstileVerificationResult> {
  const secretKey = env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  // Si no está configurada la llave secreta, omitir validación (útil para tests locales o staging sin turnstile)
  if (!secretKey) {
    console.warn('[Turnstile] CLOUDFLARE_TURNSTILE_SECRET_KEY no configurada. Omitiendo validación.');
    return { success: true };
  }

  if (!token || typeof token !== 'string' || token.trim() === '') {
    return {
      success: false,
      errorCodes: ['missing-input-response'],
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = (await response.json()) as {
      success: boolean;
      'error-codes'?: string[];
      challenge_ts?: string;
      hostname?: string;
    };

    return {
      success: Boolean(data.success),
      errorCodes: data['error-codes'],
      hostname: data.hostname,
      challengeTs: data.challenge_ts,
    };
  } catch (err) {
    console.error('[Turnstile] Error de conexión al validar con Cloudflare:', err);
    return {
      success: false,
      errorCodes: ['internal-verification-error'],
    };
  }
}

/**
 * Middleware Express para requerir y verificar Cloudflare Turnstile en endpoints sensibles.
 */
export const requireTurnstile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Si no hay secret key configurada, permitir paso
  if (!env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
    return next();
  }

  // Extraer token de request body o cabecera personalizada
  const token =
    req.body?.turnstileToken ||
    (req.headers['x-turnstile-token'] as string | undefined);

  if (!token) {
    res.status(400).json({
      success: false,
      code: 'CAPTCHA_REQUIRED',
      error: 'Verificación de seguridad (Captcha) requerida.',
    });
    return;
  }

  const clientIp = (req.headers['cf-connecting-ip'] ||
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket.remoteAddress) as string | undefined;

  const result = await verifyTurnstileToken(token, clientIp);

  if (!result.success) {
    console.warn('[Turnstile] Verificación fallida:', result.errorCodes);
    res.status(400).json({
      success: false,
      code: 'CAPTCHA_INVALID',
      error: 'La verificación de seguridad de Cloudflare ha fallado o expiró. Por favor intenta nuevamente.',
    });
    return;
  }

  next();
};
