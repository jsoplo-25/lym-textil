import React from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '../../../shared/ui/ConfirmModal';
import type { Machine } from '../types/machines.types';

interface DeleteMachineConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  machine: Machine | null;
  isLoading?: boolean;
}

export const DeleteMachineConfirmModal: React.FC<DeleteMachineConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  machine,
  isLoading,
}) => {
  if (!machine) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      icon={<Trash2 className="w-7 h-7" />}
      title="¿Eliminar máquina?"
      description={
        <>
          Estás a punto de eliminar la máquina con código{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            [{machine.code}] - {machine.name}
          </span>
          . Esta acción la dará de baja del inventario general.
        </>
      }
      confirmLabel={isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
      isLoading={isLoading}
    />
  );
};
