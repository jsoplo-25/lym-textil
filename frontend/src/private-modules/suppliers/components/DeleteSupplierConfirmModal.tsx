import React from 'react';
import { Truck } from 'lucide-react';
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
      title="¿Eliminar Proveedor?"
      description={`¿Estás seguro de que deseas eliminar permanentemente a [${supplier.document}] ${supplier.name}? Esta acción no se puede deshacer.`}
      confirmLabel="Sí, Eliminar Proveedor"
      cancelLabel="Cancelar"
      variant="danger"
      isLoading={isLoading}
      icon={<Truck className="w-6 h-6 text-rose-500" />}
    />
  );
};
