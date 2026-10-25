import React from 'react';
import { Cookie, ShieldCheck, Lock, EyeOff, Sparkles, Check } from 'lucide-react';
import { Modal } from '../../../shared/ui/Modal';
import { Button } from '../../../shared/ui/Button';

interface CookiesInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CookieDetail {
  name: string;
  type: string;
  duration: string;
  purpose: string;
  category: 'Seguridad Esencial' | 'Preferencia Visual';
}

const COOKIES_DATA: CookieDetail[] = [
  {
    name: 'access_token',
    type: 'Cookie httpOnly & Secure',
    duration: '24 horas (o sesión activa)',
    purpose: 'Autentica cada petición en el sistema de producción de forma cifrada, protegiendo tus datos contra accesos no autorizados.',
    category: 'Seguridad Esencial',
  },
  {
    name: 'refresh_token',
    type: 'Cookie httpOnly & Secure',
    duration: 'Hasta 30 días (con "Recordar sesión")',
    purpose: 'Permite renovar tu sesión segura automáticamente sin que tengas que volver a escribir tu contraseña en cada recarga.',
    category: 'Seguridad Esencial',
  },
  {
    name: 'theme',
    type: 'Almacenamiento Local (Preferencia)',
    duration: 'Persistente',
    purpose: 'Recuerda tu elección visual entre Modo Oscuro o Modo Claro para una experiencia cómoda.',
    category: 'Preferencia Visual',
  },
];

export const CookiesInfoModal: React.FC<CookiesInfoModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon={<Cookie className="w-5 h-5 text-primary-400" />}
      iconVariant="emerald"
      title="Uso de Cookies y Seguridad"
      description="Transparencia en el tratamiento de tu sesión en Textil L&M"
    >
      <div className="space-y-5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
        {/* Main notice banner */}
        <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-slate-800 dark:text-slate-200">
          <p className="leading-relaxed">
            La plataforma de <strong>Textil L&amp;M</strong> utiliza exclusivamente{' '}
            <strong className="text-primary-700 dark:text-primary-400">cookies técnicas esenciales</strong>{' '}
            para autenticar tu cuenta y resguardar la seguridad operativa.
          </p>
        </div>

        {/* Security pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white">Protección httpOnly</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Inmunes a robos de sesión por código JavaScript.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white">Cifrado de Sesión</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Transmisión segura entre el navegador y el servidor.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-2.5">
            <EyeOff className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white">Sin Rastreo</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Cero publicidad, telemetría o cookies de terceros.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed table / list of cookies */}
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary-500" />
            Cookies y elementos utilizados en esta plataforma
          </h4>

          <div className="space-y-2.5">
            {COOKIES_DATA.map((cookie) => (
              <div
                key={cookie.name}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="font-mono font-bold text-xs text-primary-700 dark:text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                    {cookie.name}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium">{cookie.type}</span>
                    <span>&bull;</span>
                    <span>{cookie.duration}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                  {cookie.purpose}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            className="font-semibold shadow-md gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Entendido</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
