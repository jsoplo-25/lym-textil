import { env } from '../../config/env';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send an email using Resend API if configured, otherwise log to console in dev mode
   */
  static async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    if (env.RESEND_API_KEY) {
      try {
        const fromAddress = env.EMAIL_FROM || 'Textiles L&M <onboarding@resend.dev>';
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [to],
            subject,
            html,
            text: text || undefined,
          }),
        });

        if (!response.ok) {
          const errData = await response.text();
          console.error(`\n❌ [EmailService] Error de Resend API (HTTP ${response.status}):`);
          console.error(errData);
          console.error(`💡 Sugerencia: En cuentas de prueba gratuitas de Resend, solo puedes enviar al correo con el que te registraste (${to}).\n`);
          console.log(`🔑 [CÓDIGO DE RECUPERACIÓN LOCAL]: El código para ${to} es => [ ${subject.match(/\d{6}/)?.[0] || 'ver código'} ]\n`);
          return false;
        }

        const data = (await response.json()) as { id?: string };
        console.log(`\n✅ [EmailService] Correo enviado exitosamente a ${to} vía Resend (ID: ${data?.id ?? 'N/A'})\n`);
        return true;
      } catch (err) {
        console.error(`\n❌ [EmailService] Falló la petición a Resend:`, err);
        return false;
      }
    }

    // Fallback: in development / if no provider key is present, log to terminal
    console.log(`\n======================================================`);
    console.log(`[EmailService] (Local/Dev Mode Preview)`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`------------------------------------------------------`);
    if (text) {
      console.log(text);
    } else {
      console.log(`HTML email content rendered for: ${to}`);
    }
    console.log(`======================================================\n`);

    return true;
  }

  /**
   * Send Password Reset Code Email with HTML template
   */
  static async sendPasswordResetCode(
    email: string,
    name: string,
    code: string
  ): Promise<boolean> {
    const subject = `Código de recuperación de contraseña: ${code} - Textiles L&M`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Contraseña</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 40px 20px; color: #f8fafc;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 20px; text-align: center; background: linear-gradient(135deg, #059669 0%, #047857 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Textiles L&M</h1>
        <p style="color: #d1fae5; margin: 6px 0 0; font-size: 13px;">Sistema de Gestión Integral</p>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 12px; font-weight: 600;">Recuperación de Acceso</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Hola <strong style="color: #f8fafc;">${name || email}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta en la plataforma de Textiles L&M.
        </p>

        <p style="color: #94a3b8; font-size: 13px; margin: 0 0 10px;">Tu código de verificación de un solo uso es:</p>
        
        <!-- Verification Code Card -->
        <div style="background-color: #0f172a; border: 2px dashed #059669; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #34d399; font-family: monospace;">${code}</span>
          <p style="margin: 6px 0 0; color: #64748b; font-size: 12px;">Válido por los próximos 15 minutos</p>
        </div>

        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0 0 20px;">
          Ingresa este código en la pantalla de recuperación para definir una nueva contraseña. Si tú no solicitaste este cambio, puedes ignorar este mensaje de forma segura.
        </p>

        <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0 20px;" />

        <p style="color: #64748b; font-size: 11px; margin: 0; text-align: center;">
          Por tu seguridad, nunca compartas este código con nadie. Textiles L&M nunca te pedirá este código por teléfono o chat.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 16px 32px; background-color: #0f172a; text-align: center; border-top: 1px solid #334155;">
        <p style="color: #475569; font-size: 11px; margin: 0;">
          © 2026 Textiles L&M. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `Hola ${name || email},\n\nTu código de verificación para restablecer tu contraseña en Textiles L&M es: ${code}\n\nEste código es válido durante 15 minutos.\nSi no solicitaste este cambio, ignora este mensaje.`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }
}
