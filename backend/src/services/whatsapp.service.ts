import { env } from '../config/env';
import { prisma } from '../config/prisma';

export interface WhatsAppSendResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
}

export interface ThresholdMilestoneCheckResult {
  checked: boolean;
  batchNumber?: string;
  totalFabricKg?: number;
  readyRollsCount?: number;
  readyKg?: number;
  accumulatedKg?: number;
  percentage?: number;
  notifiedMilestones?: number[];
  newlyNotified?: number[];
  errors?: string[];
  reason?: string;
}

export class WhatsAppService {
  /**
   * Limpia y normaliza el número de teléfono para WhatsApp.
   * Por defecto para Perú agrega el prefijo 51 si tiene 9 dígitos empezando en 9.
   */
  static cleanPhoneNumber(rawPhone: string): string {
    if (!rawPhone) return '';
    let cleaned = rawPhone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    // Si tiene 9 dígitos y empieza con 9 (número celular en Perú), anteponer 51
    if (cleaned.length === 9 && cleaned.startsWith('9')) {
      cleaned = `51${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Envía un mensaje de texto mediante la API Cloud de WhatsApp (Meta)
   */
  static async sendTextMessage(toPhone: string, text: string): Promise<WhatsAppSendResult> {
    const cleanedPhone = this.cleanPhoneNumber(toPhone);
    if (!cleanedPhone) {
      return { success: false, error: 'Número de teléfono inválido o vacío.' };
    }

    const token = env.WHATSAPP_API_TOKEN?.trim();
    const phoneId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    const apiVersion = env.WHATSAPP_API_VERSION?.trim() || 'v21.0';

    // Si aún no se configuran las credenciales en .env, dejamos registro y simulamos sin romper la ejecución
    if (!token || !phoneId) {
      console.warn(
        `[WhatsAppService] Credenciales no configuradas (WHATSAPP_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID). Modo SIMULACIÓN activo para ${cleanedPhone}.`
      );
      return {
        success: true,
        simulated: true,
        messageId: `simulated_${Date.now()}`,
      };
    }

    try {
      const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: text,
          },
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        if (data?.error?.code === 100 && (cleanedPhone.endsWith('908675224') || String(data?.error?.message).includes('Invalid parameter'))) {
          return {
            success: false,
            error: 'No puedes enviar un WhatsApp al mismo número emisor de la empresa (+51 908 675 224). El proveedor debe tener un número de celular de destino diferente.',
          };
        }
        const message = data?.error?.message || 'Error al enviar mensaje por WhatsApp';
        const code = data?.error?.code ? ` (Code ${data.error.code})` : '';
        const subcode = data?.error?.error_subcode ? ` (Subcode ${data.error.error_subcode})` : '';
        const details = data?.error?.error_data?.details ? ` - ${data.error.error_data.details}` : '';
        const fullError = `${message}${code}${subcode}${details}`;
        console.error(`[WhatsAppService] Error en respuesta de Meta API:`, JSON.stringify(data, null, 2));
        return { success: false, error: fullError };
      }

      const messageId = data?.messages?.[0]?.id || 'msg_sent_ok';
      return { success: true, messageId };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al invocar WhatsApp API';
      console.error(`[WhatsAppService] Error de conexión:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Envía un mensaje con plantilla oficial de WhatsApp (ej. 'hello_world' o plantilla aprobada)
   */
  static async sendTemplateMessage(
    toPhone: string,
    templateName: string = 'hello_world',
    languageCode: string = 'en_US'
  ): Promise<WhatsAppSendResult> {
    const cleanedPhone = this.cleanPhoneNumber(toPhone);
    if (!cleanedPhone) {
      return { success: false, error: 'Número de teléfono inválido o vacío.' };
    }

    const token = env.WHATSAPP_API_TOKEN?.trim();
    const phoneId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    const apiVersion = env.WHATSAPP_API_VERSION?.trim() || 'v21.0';

    if (!token || !phoneId) {
      return {
        success: true,
        simulated: true,
        messageId: `simulated_${Date.now()}`,
      };
    }

    try {
      const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode,
            },
          },
        }),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        const message = data?.error?.message || 'Error al enviar plantilla WhatsApp';
        const code = data?.error?.code ? ` (Code ${data.error.code})` : '';
        const details = data?.error?.error_data?.details ? ` - ${data.error.error_data.details}` : '';
        return { success: false, error: `${message}${code}${details}` };
      }

      const messageId = data?.messages?.[0]?.id || 'msg_sent_ok';
      return { success: true, messageId };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al invocar WhatsApp API';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Evalúa si un lote ha alcanzado los umbrales del 25%, 50%, 75% o 100% de rollos
   * en estado 'Listo para recojo' (o entregados acumulados) respecto al Total de kilos de tela.
   * Si se alcanza un umbral no notificado previamente, envía la notificación por WhatsApp al proveedor.
   */
  static async checkAndNotifyPickupThreshold(batchId: string): Promise<ThresholdMilestoneCheckResult> {
    try {
      const batch = await prisma.productionBatch.findUnique({
        where: { id: batchId },
        include: {
          supplier: true,
          rolls: true,
        },
      });

      if (!batch) {
        return { checked: false, reason: 'Lote no encontrado.' };
      }

      const totalFabricKg = batch.totalFabricKg ?? 0;
      if (totalFabricKg <= 0) {
        return {
          checked: false,
          batchNumber: batch.batchNumber,
          reason: 'El lote no tiene configurado el "Total de kilos de tela" (o es 0), por lo que no se pueden calcular porcentajes.',
        };
      }

      // Rollos que están actualmente listos para recojo
      const readyRolls = batch.rolls.filter((r: { status: string; weight: number | null }) => r.status === 'READY_FOR_PICKUP');
      const readyKg = readyRolls.reduce((sum: number, r: { weight: number | null }) => sum + (r.weight || 0), 0);
      const readyRollsCount = readyRolls.length;

      // Rollos acumulados que han completado producción y alcanzaron recojo o entrega
      const completedRolls = batch.rolls.filter(
        (r: { status: string; weight: number | null }) => r.status === 'READY_FOR_PICKUP' || r.status === 'DELIVERED'
      );
      const accumulatedKg = completedRolls.reduce((sum: number, r: { weight: number | null }) => sum + (r.weight || 0), 0);

      // Porcentaje alcanzado con respecto al total de kilos de tela proyectados
      const rawPercentage = (accumulatedKg / totalFabricKg) * 100;
      const currentPercentage = Math.floor(rawPercentage);

      const targetMilestones = [25, 50, 75, 100];
      const rawNotifiedList = Array.isArray(batch.notifiedMilestones) ? [...batch.notifiedMilestones] : [];

      // Normalizar: si un hito superior ya fue notificado, marcar automáticamente
      // todos los inferiores como notificados (evita reenvíos de hitos menores)
      const highestNotified = rawNotifiedList.length > 0 ? Math.max(...rawNotifiedList.map(Number)) : 0;
      const notifiedList = [...new Set([
        ...rawNotifiedList,
        ...targetMilestones.filter((m) => m <= highestNotified),
      ])];

      const newlyNotified: number[] = [];
      const errors: string[] = [];

      const supplierPhone = batch.supplier?.phone || '';
      const supplierName = batch.supplier?.name || batch.supplierName || 'Estimado Proveedor';

      // Asegurar que el lote tenga código de seguimiento único
      let trackingCode = batch.trackingCode;
      if (!trackingCode) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let random = '';
        for (let i = 0; i < 6; i++) {
          random += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        trackingCode = `TRK-${random}`;
        try {
          await prisma.productionBatch.update({
            where: { id: batch.id },
            data: { trackingCode },
          });
        } catch {
          // Continuar con trackingCode generado si fallara el update
        }
      }

      // URL oficial de seguimiento para proveedores
      const rawFrontend =
        env.FRONTEND_URL &&
        env.FRONTEND_URL !== '*' &&
        !env.FRONTEND_URL.includes('localhost') &&
        !env.FRONTEND_URL.includes('vercel.app')
          ? env.FRONTEND_URL.split(',')[0].trim().replace(/\/+$/, '')
          : 'https://www.lymtextil.com';
      const frontendBase = rawFrontend || 'https://www.lymtextil.com';
      const trackingUrl = `${frontendBase}/tracking/${encodeURIComponent(trackingCode)}`;

      // Determinar qué hitos nuevos se han alcanzado (no notificados previamente)
      const pendingMilestones = targetMilestones.filter(
        (m) => currentPercentage >= m && !notifiedList.includes(m)
      );

      if (pendingMilestones.length > 0) {
        // Solo enviar notificación del hito MÁS ALTO alcanzado
        // Los hitos anteriores se marcan como notificados silenciosamente
        const highestMilestone = pendingMilestones[pendingMilestones.length - 1];
        const skippedMilestones = pendingMilestones.slice(0, -1);

        // Marcar hitos saltados como notificados sin enviar mensaje
        for (const skipped of skippedMilestones) {
          notifiedList.push(skipped);
          newlyNotified.push(skipped);

          // Registrar en bitácora que se saltó (sin enviar)
          try {
            await prisma.whatsAppNotificationLog.create({
              data: {
                batchId: batch.id,
                supplierId: batch.supplierId,
                supplierName,
                phoneNumber: supplierPhone || 'SIN_NUMERO',
                percentage: skipped,
                totalKg: totalFabricKg,
                readyKg,
                rollsCount: readyRollsCount,
                message: `[SALTADO] Hito ${skipped}% superado directamente. Se notificó el hito ${highestMilestone}% en su lugar.`,
                status: 'SKIPPED',
                responseId: null,
                errorDetails: null,
              },
            });
          } catch (logErr: unknown) {
            console.error('[WhatsAppService] Error al guardar log de hito saltado:', logErr);
          }
        }

        // Enviar notificación SOLO del hito más alto
        const message = [
          `🏭 *TEXTILES L&M - Notificación de Recojo de Rollos*`,
          ``,
          `Estimado(a) *${supplierName}*, le informamos sobre el avance de producción de su lote:`,
          ``,
          `📦 *Lote:* ${batch.batchNumber}`,
          `🔍 *Código de Seguimiento:* ${trackingCode}`,
          `🎯 *Avance de producción:* ¡Se ha alcanzado el *${highestMilestone}%*! (${accumulatedKg.toFixed(2)} Kg de ${totalFabricKg.toFixed(2)} Kg)`,
          `🧺 *Rollos disponibles para recojo:* ${readyRollsCount} rollo(s) (${readyKg.toFixed(2)} Kg)`,
          ``,
          `🌐 *Ver seguimiento en vivo de sus rollos:*`,
          `${trackingUrl}`,
          ``,
          `Puede coordinar con planta para el recojo de los rollos disponibles.`,
          `📍 *Textiles L&M*`,
        ].join('\n');

        let sendStatus = 'SENT';
        let responseId: string | undefined = undefined;
        let errorDetails: string | undefined = undefined;

        if (!supplierPhone) {
          sendStatus = 'FAILED';
          errorDetails = 'El proveedor no tiene número de teléfono / WhatsApp registrado en su ficha.';
          errors.push(`Hito ${highestMilestone}%: Proveedor sin teléfono registrado.`);
        } else {
          let sendResult = await this.sendTextMessage(supplierPhone, message);

          // Si falla porque han pasado más de 24h desde el último mensaje del cliente, Meta exige plantilla:
          if (
            !sendResult.success &&
            sendResult.error &&
            (sendResult.error.includes('131047') ||
              sendResult.error.toLowerCase().includes('template') ||
              sendResult.error.toLowerCase().includes('24 hour'))
          ) {
            console.log('[WhatsAppService] Ventana de 24h cerrada. Reintentando con plantilla aprobada...');
            sendResult = await this.sendTemplateMessage(supplierPhone, '3p_direct_integration_test_template', 'en_US');
          }

          if (sendResult.success) {
            sendStatus = sendResult.simulated ? 'SIMULATED' : 'SENT';
            responseId = sendResult.messageId;
            newlyNotified.push(highestMilestone);
            notifiedList.push(highestMilestone);
          } else {
            sendStatus = 'FAILED';
            errorDetails = sendResult.error || 'Error al enviar por WhatsApp';
            errors.push(`Hito ${highestMilestone}%: ${errorDetails}`);
          }
        }

        // Registrar en bitácora de notificaciones de WhatsApp
        try {
          await prisma.whatsAppNotificationLog.create({
            data: {
              batchId: batch.id,
              supplierId: batch.supplierId,
              supplierName,
              phoneNumber: supplierPhone || 'SIN_NUMERO',
              percentage: highestMilestone,
              totalKg: totalFabricKg,
              readyKg,
              rollsCount: readyRollsCount,
              message,
              status: sendStatus,
              responseId: responseId || null,
              errorDetails: errorDetails || null,
            },
          });
        } catch (logErr: unknown) {
          console.error('[WhatsAppService] Error al guardar log de WhatsApp:', logErr);
        }
      }

      // Si se notificaron nuevos hitos, actualizar el array notifiedMilestones en la base de datos
      if (newlyNotified.length > 0) {
        await prisma.productionBatch.update({
          where: { id: batch.id },
          data: {
            notifiedMilestones: notifiedList,
          },
        });
      }

      return {
        checked: true,
        batchNumber: batch.batchNumber,
        totalFabricKg,
        readyRollsCount,
        readyKg: parseFloat(readyKg.toFixed(2)),
        accumulatedKg: parseFloat(accumulatedKg.toFixed(2)),
        percentage: currentPercentage,
        notifiedMilestones: notifiedList,
        newlyNotified,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error inesperado al calcular hitos de WhatsApp';
      console.error('[WhatsAppService] Error en checkAndNotifyPickupThreshold:', err);
      return { checked: false, reason: errorMsg };
    }
  }
}
