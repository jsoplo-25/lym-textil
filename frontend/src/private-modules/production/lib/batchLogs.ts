import type { BatchStatusLog } from '../types/production.types';

/**
 * Los movimientos de cada rollo (visto bueno, entrega, cambio de estado) se guardan en la
 * misma tabla, pero se muestran solo en la bitácora del rollo. La bitácora del lote
 * conserva únicamente los cambios propios del lote.
 */
const isRollLog = (log: BatchStatusLog): boolean => {
  const notes = (log.notes || '').trim();
  return /^Rollo\s+(#|N°)/i.test(notes) || /^Entrega masiva/i.test(notes);
};

export const getBatchLevelLogs = (logs?: BatchStatusLog[] | null): BatchStatusLog[] =>
  (logs || []).filter((l) => !isRollLog(l));
