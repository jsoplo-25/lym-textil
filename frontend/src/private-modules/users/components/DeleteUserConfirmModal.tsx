import React from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '../../../shared/ui/ConfirmModal';
import type { ManagedUser } from '../types/users.types';

interface DeleteUserConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user: ManagedUser | null;
  isLoading?: boolean;
}

export const DeleteUserConfirmModal: React.FC<DeleteUserConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  isLoading,
}) => {
  if (!user) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      icon={<Trash2 className="w-7 h-7" />}
      title="¿Eliminar usuario?"
      description={
        <>
          Estás por eliminar la cuenta de{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {user.firstName} {user.lastName}
          </span>{' '}
          ({user.email}). Esta acción retirará todos sus accesos al sistema.
        </>
      }
      confirmLabel={isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
      isLoading={isLoading}
    />
  );
};
