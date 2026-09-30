import React from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '../../../shared/ui/ConfirmModal';
import type { RoleDefinition } from '../types/roles.types';

interface DeleteRoleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  role: RoleDefinition | null;
  isLoading?: boolean;
}

export const DeleteRoleConfirmModal: React.FC<DeleteRoleConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  role,
  isLoading,
}) => {
  if (!role) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      icon={<Trash2 className="w-7 h-7" />}
      title="¿Eliminar rol?"
      description={
        <>
          Estás por eliminar el rol{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {role.name} [{role.code}]
          </span>
          . Esta acción eliminará permanentemente la configuración y facultades de este rol.
        </>
      }
      confirmLabel={isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
      isLoading={isLoading}
    />
  );
};
