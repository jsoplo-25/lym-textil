import type { ProductionBatch, BatchStatus, RollStatus } from '../types/production.types';
import { formatLocalDate } from '../../../shared/lib/utils';

const BATCH_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Solicitud registrada',
  IN_PROGRESS: 'En proceso',
  PAUSED: 'Pausado',
  COMPLETED: 'Terminado',
  IN_PREPARATION: 'En preparación',
  READY_FOR_PICKUP: 'Listo para recojo',
  DELIVERED: 'Entregado',
  DISPATCHED: 'Despachado',
};

const ROLL_STATUS_LABELS: Record<RollStatus, string> = {
  REGISTERED: 'Registrado',
  IN_PREPARATION: 'En preparación',
  READY_FOR_APPROVAL: 'Listo para aprobar',
  READY_FOR_PICKUP: 'Listo para recojo',
  DELIVERED: 'Entregado',
};

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } } as const;
const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
} as const;

const dateOrDash = (value?: string | null) => (value ? formatLocalDate(value) : '-');

export async function exportBatchToExcel(batch: ProductionBatch): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Textil LYM';
  workbook.created = new Date();

  const rolls = batch.rolls ?? [];
  const totalWeight = rolls.reduce((sum, r) => sum + (r.weight || 0), 0);
  const avgWeight = rolls.length > 0 ? totalWeight / rolls.length : 0;
  const countByStatus = (status: RollStatus) =>
    rolls.filter((r) => (r.status || 'REGISTERED') === status).length;

  // ── Hoja 1: Resumen del lote ──
  const summary = workbook.addWorksheet('Lote');
  summary.columns = [{ width: 28 }, { width: 50 }];

  const title = summary.addRow([`LOTE: ${batch.batchNumber}`]);
  summary.mergeCells(title.number, 1, title.number, 2);
  title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  title.fill = HEADER_FILL;
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  title.height = 26;

  const info: Array<[string, string | number]> = [
    ['Cód. Seguimiento', batch.trackingCode || '-'],
    ['Estado', BATCH_STATUS_LABELS[batch.status as BatchStatus] || batch.status],
    ['Proveedor', batch.supplierName || batch.supplier?.name || '-'],
    ['Documento proveedor', batch.supplier?.document || '-'],
    ['Máquina', batch.machineName || '-'],
    ['Fecha inicio', dateOrDash(batch.startDate)],
    ['Fecha fin', dateOrDash(batch.endDate)],
    ['Notas / Despacho', batch.notes || '-'],
    ['Total rollos', rolls.length],
    ['Peso total (Kg)', Number(totalWeight.toFixed(2))],
    ['Peso promedio (Kg)', Number(avgWeight.toFixed(2))],
    ['Rollos registrados', countByStatus('REGISTERED')],
    ['Rollos en preparación', countByStatus('IN_PREPARATION')],
    ['Rollos por aprobar', countByStatus('READY_FOR_APPROVAL')],
    ['Rollos listos para recojo', countByStatus('READY_FOR_PICKUP')],
    ['Rollos entregados', countByStatus('DELIVERED')],
  ];
  info.forEach(([label, value]) => {
    const row = summary.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    row.getCell(2).alignment = { horizontal: 'left', wrapText: true };
    row.eachCell((c) => (c.border = THIN_BORDER));
  });

  // Hilos del lote
  const yarns = batch.yarns ?? [];
  if (yarns.length > 0) {
    summary.addRow([]);
    const yarnTitle = summary.addRow(['Hilos del lote']);
    yarnTitle.font = { bold: true, size: 12 };
    yarns.forEach((y) => {
      const detail = [y.color, y.lotCode && `Lote ${y.lotCode}`, y.rollCount != null && `${y.rollCount} rollos`]
        .filter(Boolean)
        .join(' • ');
      const row = summary.addRow([y.yarnName, detail || '-']);
      row.eachCell((c) => (c.border = THIN_BORDER));
    });
  }

  // ── Hoja 2: Rollos ──
  const sheet = workbook.addWorksheet('Rollos', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [
    { header: 'Rollo', key: 'roll', width: 10 },
    { header: 'Estado', key: 'status', width: 20 },
    { header: 'Operario Inicio', key: 'startOp', width: 26 },
    { header: 'Fecha Inicio', key: 'startDate', width: 14 },
    { header: 'H. Inicio', key: 'startTime', width: 10 },
    { header: 'Operario Término', key: 'endOp', width: 26 },
    { header: 'Fecha Término', key: 'endDate', width: 14 },
    { header: 'H. Término', key: 'endTime', width: 11 },
    { header: 'Peso (Kg)', key: 'weight', width: 12 },
    { header: 'Observaciones', key: 'obs', width: 40 },
  ];

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = HEADER_FILL;
  header.alignment = { vertical: 'middle', horizontal: 'center' };
  header.height = 22;

  rolls.forEach((r) => {
    sheet.addRow({
      roll: r.rollNumber,
      status: ROLL_STATUS_LABELS[r.status || 'REGISTERED'],
      startOp: r.startOperator || '-',
      startDate: dateOrDash(r.startDate),
      startTime: r.startTime || '-',
      endOp: r.endOperator || '-',
      endDate: dateOrDash(r.endDate),
      endTime: r.endTime || '-',
      weight: r.weight ?? null,
      obs: r.observations || '-',
    });
  });

  sheet.getColumn('weight').numFmt = '0.00';
  sheet.eachRow((row) => row.eachCell((c) => (c.border = THIN_BORDER)));

  const totalRow = sheet.addRow({
    roll: 'TOTAL',
    weight: Number(totalWeight.toFixed(2)),
    obs: `Promedio por rollo: ${avgWeight.toFixed(2)} Kg`,
  });
  totalRow.font = { bold: true };
  totalRow.eachCell({ includeEmpty: true }, (c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c.border = THIN_BORDER;
  });
  totalRow.getCell('weight').numFmt = '0.00';

  // ── Descarga ──
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Lote_${batch.batchNumber}.xlsx`.replace(/[\\/:*?"<>|]/g, '-');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
