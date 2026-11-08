import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Supplier } from '../types/suppliers.types';
import { ConfirmModal } from '../../../shared/ui/ConfirmModal';

interface DeleteSupplierConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  supplier: Supplier | null;
  isLoading?: boolean;
}

export const DeleteSupplierConfirmModal: React.FC<DeleteSupplierConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  supplier,
  isLoading = false,
}) => {
  if (!supplier) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      icon={<Trash2 className="w-7 h-7" />}
      title="¿Eliminar proveedor?"
      description={
        <>
          Estás por eliminar el proveedor{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {supplier.name}
          </span>
          . Esta acción lo retirará del catálogo de proveedores del sistema.
        </>
      }
      confirmLabel={isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
      cancelLabel="Cancelar"
      isLoading={isLoading}
    />
  );
};
