import React from 'react';
import { LogOut } from 'lucide-react';
import { ConfirmModal } from '../../ui/ConfirmModal';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      variant="danger"
      icon={<LogOut className="w-7 h-7" />}
      title="¿Deseas cerrar sesión?"
      description={
        <>
          Se cerrará tu sesión actual en <span className="font-semibold text-slate-700 dark:text-slate-300">Textil L&M</span> y volverás a la pantalla de acceso.
        </>
      }
      confirmLabel="Aceptar"
    />
  );
};
