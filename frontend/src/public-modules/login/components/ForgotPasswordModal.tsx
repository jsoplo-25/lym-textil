import React, { useState, useEffect } from 'react';
import { Mail, Key, ShieldCheck, CheckCircle2, ArrowLeft, RefreshCw, Lock } from 'lucide-react';
import { Modal } from '../../../shared/ui/Modal';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { Alert } from '../../../shared/ui/Alert';
import { loginService } from '../services/login.service';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onPasswordResetSuccess?: (email: string) => void;
}

type RecoveryStep = 'EMAIL' | 'CODE_AND_PASSWORD' | 'SUCCESS';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  onPasswordResetSuccess,
}) => {
  const [step, setStep] = useState<RecoveryStep>('EMAIL');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cooldown timer for resending OTP code
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      setStep('EMAIL');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMsg(null);
      setCountdown(0);
    }
  }, [isOpen, defaultEmail]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await loginService.forgotPassword(email);
      setStep('CODE_AND_PASSWORD');
      setCountdown(60);
      setSuccessMsg('Código de verificación enviado. Revisa tu bandeja de entrada o spam.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      setError(errorObj.response?.data?.error || errorObj.message || 'Error al solicitar el código de recuperación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || isLoading) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await loginService.forgotPassword(email);
      setCountdown(60);
      setSuccessMsg('Se ha reenviado un nuevo código de verificación.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      setError(errorObj.response?.data?.error || errorObj.message || 'No se pudo reenviar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!code || code.trim().length < 4) {
      setError('Por favor ingresa el código de verificación de 6 dígitos.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      await loginService.resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });

      setStep('SUCCESS');
      if (onPasswordResetSuccess) {
        onPasswordResetSuccess(email);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      setError(errorObj.response?.data?.error || errorObj.message || 'Error al restablecer la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 'SUCCESS'
          ? '¡Restablecimiento Exitoso!'
          : step === 'CODE_AND_PASSWORD'
          ? 'Restablecer Contraseña'
          : 'Recuperación de Contraseña'
      }
      description={
        step === 'SUCCESS'
          ? 'Tu cuenta ha sido actualizada con éxito'
          : step === 'CODE_AND_PASSWORD'
          ? 'Verifica el código y asigna tu nueva clave'
          : 'Ingresa tu correo para recibir un código de acceso'
      }
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="error" size="sm">
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert variant="success" size="sm">
            {successMsg}
          </Alert>
        )}

        {/* STEP 1: SOLICITAR CODIGO */}
        {step === 'EMAIL' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ingresa el correo electrónico asociado a tu cuenta de <strong>Textiles L&M</strong>. Te enviaremos un código de seguridad de 6 dígitos para validar tu identidad.
            </p>

            <Input
              label="Correo Electrónico Corporativo"
              type="email"
              placeholder="tu@textil-lym.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
              autoFocus
            />

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" variant="secondary" isLoading={isLoading} className="font-semibold shadow-md">
                <span>Enviar Código</span>
                <ShieldCheck className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: CODIGO Y NUEVA CONTRASEÑA */}
        {step === 'CODE_AND_PASSWORD' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate pr-2">
                <Mail className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 truncate font-medium">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('EMAIL');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-primary-600 dark:text-primary-400 hover:underline font-semibold text-[11px] shrink-0 cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            <Input
              label="Código de Verificación (6 dígitos)"
              type="text"
              placeholder="Ej. 123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              leftIcon={<Key className="w-4 h-4" />}
              maxLength={6}
              required
              autoFocus
              className="tracking-widest font-mono font-semibold"
            />

            <Input
              label="Nueva Contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirmar Nueva Contraseña"
              type="password"
              placeholder="Repite la nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0 || isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>
                  {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStep('EMAIL')}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" variant="secondary" isLoading={isLoading} className="font-semibold shadow-md">
                <span>Restablecer Contraseña</span>
                <CheckCircle2 className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: ÉXITO */}
        {step === 'SUCCESS' && (
          <div className="py-4 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400 flex items-center justify-center ring-8 ring-primary-50 dark:ring-primary-900/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1 max-w-sm">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Contraseña actualizada con éxito
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tu clave ha sido modificada de forma segura. Ya puedes ingresar al sistema con tu nueva contraseña.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full font-semibold shadow-lg mt-2"
              onClick={handleFinish}
            >
              Iniciar Sesión Ahora
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
