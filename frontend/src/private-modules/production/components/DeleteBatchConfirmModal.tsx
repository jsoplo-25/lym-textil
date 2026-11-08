import React from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '../../../shared/ui/ConfirmModal';
import type { ProductionBatch } from '../types/production.types';

interface DeleteBatchConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  batch: ProductionBatch | null;
  isLoading?: boolean;
}

export const DeleteBatchConfirmModal: React.FC<DeleteBatchConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  batch,
  isLoading,
}) => {
  if (!batch) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      icon={<Trash2 className="w-7 h-7" />}
      title="¿Eliminar lote de producción?"
      description={
        <>
          Estás por eliminar el lote{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {batch.batchNumber}
          </span>{' '}
          y todos sus rollos registrados ({batch.totalRolls || 0} rollos). Esta acción no se puede deshacer.
        </>
      }
      confirmLabel={isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
      isLoading={isLoading}
    />
  );
};
