import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  User,
  Users,
  Shield,
  Key,
  Save,
  Lock,
  Sparkles,
  Layers,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { RootState } from '../../../app/store';
import { updateUserProfile } from '../../../entities/session/sessionSlice';
import { profileService } from '../services/profile.service';
import { Avatar } from '../../../shared/ui/Avatar';
import { Alert } from '../../../shared/ui/Alert';
import { getRoleDisplayName, hasPermission } from '../../../shared/lib/roles';
import { Tooltip } from '../../../shared/ui/Tooltip';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { Button } from '../../../shared/ui/Button';
import { Badge } from '../../../shared/ui/Badge';

export const ProfilePage: React.FC = () => {
  const dispatch = useDispatch();
  const sessionUser = useSelector((state: RootState) => state.session.user);

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'permissions'>('info');

  // Personal Info Form State
  const [firstName, setFirstName] = useState(sessionUser?.firstName || '');
  const [lastName, setLastName] = useState(sessionUser?.lastName || '');
  const [email, setEmail] = useState(sessionUser?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(sessionUser?.avatarUrl || '');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status Feedback
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionUser) {
      setFirstName(sessionUser.firstName || (sessionUser.name ? sessionUser.name.split(' ')[0] : ''));
      setLastName(sessionUser.lastName || (sessionUser.name ? sessionUser.name.split(' ').slice(1).join(' ') : ''));
      setEmail(sessionUser.email || '');
      setAvatarUrl(sessionUser.avatarUrl || '');
    }
  }, [sessionUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    setInfoSuccess(null);
    setInfoError(null);

    try {
      const updated = await profileService.updateProfile({
        firstName,
        lastName,
        email,
        avatarUrl: avatarUrl || undefined,
      });

      dispatch(
        updateUserProfile({
          firstName: updated.firstName,
          lastName: updated.lastName,
          name: `${updated.firstName} ${updated.lastName}`.trim(),
          email: updated.email,
          avatarUrl: updated.avatarUrl,
        })
      );

      setInfoSuccess('¡Tu perfil se actualizó correctamente en Textil L&M!');
      setTimeout(() => setInfoSuccess(null), 4000);
    } catch (err: unknown) {
      const errorObj = err && typeof err === 'object' ? (err as { response?: { data?: { error?: string } }; message?: string }) : null;
      setInfoError(errorObj?.response?.data?.error || errorObj?.message || 'Error al actualizar el perfil.');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las nuevas contraseñas no coinciden.');
      return;
    }

    setIsSavingPassword(true);

    try {
      await profileService.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess('¡Contraseña actualizada exitosamente!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: unknown) {
      const errorObj = err && typeof err === 'object' ? (err as { response?: { data?: { error?: string } }; message?: string }) : null;
      setPasswordError(errorObj?.response?.data?.error || errorObj?.message || 'Error al cambiar la contraseña.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Misma jerarquía de 3 niveles usada en Usuarios y Roles: primario, secundario y grises.
  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20';
      case 'MANAGER':
      case 'SUPERVISOR':
        return 'bg-slate-900/6 text-slate-700 dark:bg-white/10 dark:text-slate-200 border-slate-900/10 dark:border-white/15';
      default:
        return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Header Profile Hero Card */}
      <div className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Decorative Top Textile Pattern Banner */}
        <div className="h-36 sm:h-44 w-full bg-primary-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-primary-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-3 right-3 sm:top-4 sm:right-6 max-w-[calc(100%-1.5rem)] flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md text-white text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-primary-300" />
            <span className="truncate">Textil L&M Security Verified</span>
          </div>
        </div>

        {/* Profile Identity Bar */}
        <div className="px-4 sm:px-8 pb-5 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left min-w-0 max-w-full">
            {/* Big Avatar - only the avatar floats up to overlap the banner */}
            <div className="relative -mt-16 sm:-mt-20 shrink-0">
              <div className="p-1 rounded-full bg-white dark:bg-slate-900 shadow-2xl ring-4 ring-white dark:ring-slate-900">
                <Avatar
                  firstName={sessionUser?.firstName}
                  lastName={sessionUser?.lastName}
                  name={sessionUser?.name}
                  size="xl"
                  className="w-24 h-24 sm:w-28 sm:h-28 text-3xl font-black"
                />
              </div>
              <Tooltip content="Cuenta verificada" position="right" className="absolute bottom-1 right-1">
                <span
                  role="img"
                  aria-label="Cuenta verificada"
                  className="w-6 h-6 bg-primary-500 border-4 border-white dark:border-slate-900 rounded-full flex items-center justify-center shadow"
                >
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                </span>
              </Tooltip>
            </div>

            {/* Name, Email & Role - sits cleanly in the white/dark card area */}
            <div className="pt-2 sm:pt-3 min-w-0 max-w-full">
              <PageHeader
                eyebrowIcon={<User className="w-4 h-4" />}
                eyebrow="Mi Cuenta • Perfil y Preferencias"
                title={
                  sessionUser?.firstName
                    ? `${sessionUser.firstName} ${sessionUser?.lastName || ''}`.trim()
                    : sessionUser?.name || 'Usuario'
                }
                subtitle={sessionUser?.email || ''}
              />
              <Badge className={`mt-2 ${getRoleBadgeColor(sessionUser?.role)}`}>
                {getRoleDisplayName(sessionUser)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-8 flex border-t border-slate-100 dark:border-slate-800 gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 px-2 sm:px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'info'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <User className="w-4 h-4" />
            <span>Datos Personales</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-4 px-2 sm:px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'security'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Key className="w-4 h-4" />
            <span>Seguridad y Contraseña</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-4 px-2 sm:px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'permissions'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Shield className="w-4 h-4" />
            <span>Permisos Asignados</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Personal Info */}
      {activeTab === 'info' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-8 shadow-xl">
          <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Información de la Cuenta
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Actualiza tus datos de contacto y visualización en el sistema de producción.
            </p>
          </div>

          {infoSuccess && (
            <Alert variant="success" className="mb-6">
              {infoSuccess}
            </Alert>
          )}

          {infoError && (
            <Alert variant="error" className="mb-6">
              {infoError}
            </Alert>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Nombres
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Ej. Jhon Anderson"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Ej. Soplopuco Lavado"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Identificador Visual (Iniciales)
                </label>
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Avatar firstName={firstName} lastName={lastName} size="sm" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-0">
                    Iniciales en el sistema:{' '}
                    <strong className="text-primary-600 dark:text-primary-400 text-sm">
                      {firstName && lastName ? `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase() : 'JS'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Role Notice Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Nivel de Autorización: {getRoleDisplayName(sessionUser)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Los cambios de rol de usuario son administrados en el módulo Mantenedor de Usuarios para garantizar la trazabilidad operacional.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 [&>button]:w-full sm:[&>button]:w-auto">
              <Button type="submit" variant="secondary" size="cta" isLoading={isSavingInfo}>
                <Save className="w-4 h-4" />
                <span>{isSavingInfo ? 'Guardando...' : 'Guardar Cambios'}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-8 shadow-xl">
          <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Seguridad y Contraseña
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Protege el acceso a tu cuenta textil cambiando tu clave periódicamente.
            </p>
          </div>

          {passwordSuccess && (
            <Alert variant="success" className="mb-6">
              {passwordSuccess}
            </Alert>
          )}

          {passwordError && (
            <Alert variant="error" className="mb-6">
              {passwordError}
            </Alert>
          )}

          <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Contraseña Actual
              </label>
              <div className="relative flex items-center">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer flex items-center justify-center p-0.5"
                  tabIndex={-1}
                  aria-label={showCurrentPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative flex items-center">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer flex items-center justify-center p-0.5"
                  tabIndex={-1}
                  aria-label={showNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repite la nueva contraseña"
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer flex items-center justify-center p-0.5"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 [&>button]:w-full sm:[&>button]:w-auto">
              <Button type="submit" variant="secondary" size="cta" isLoading={isSavingPassword}>
                <Lock className="w-4 h-4" />
                <span>{isSavingPassword ? 'Cambiando clave...' : 'Actualizar Contraseña'}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Permissions & Role Details */}
      {activeTab === 'permissions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-8 shadow-xl">
          <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Permisos y Capacidades Operativas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualiza las funciones autorizadas para tu rol <span className="font-bold text-slate-800 dark:text-slate-200">[{getRoleDisplayName(sessionUser)}]</span> en la fábrica textil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dashboard Capability */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2.5 text-primary-600 dark:text-primary-400 font-bold text-sm">
                <Layers className="w-4 h-4" />
                <span>Panel Principal (Dashboard)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                  <span>Acceso al Dashboard general del sistema</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                  <span>Visualización de métricas e indicadores de producción</span>
                </li>
              </ul>
            </div>

            {/* Profile Capability */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2.5 text-primary-600 dark:text-primary-400 font-bold text-sm">
                <User className="w-4 h-4" />
                <span>Mi Perfil de Usuario</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                  <span>Consulta de datos personales y facultades asignadas</span>
                </li>
                {hasPermission(sessionUser, 'profile:edit') && (
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                    <span>Actualización de información de contacto y contraseña</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Users Capability */}
            {hasPermission(sessionUser, 'users:read') ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2.5 text-primary-600 dark:text-primary-400 font-bold text-sm">
                  <Users className="w-4 h-4" />
                  <span>Mantenedor de Usuarios</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                    <span>Consulta de colaboradores y estados de cuenta</span>
                  </li>
                  {hasPermission(sessionUser, 'users:create') && (
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                      <span>Registro y alta de nuevos colaboradores</span>
                    </li>
                  )}
                  {hasPermission(sessionUser, 'users:edit') && (
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                      <span>Edición de datos y credenciales de colaboradores</span>
                    </li>
                  )}
                  {hasPermission(sessionUser, 'users:delete') && (
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                      <span>Baja y eliminación de cuentas</span>
                    </li>
                  )}
                </ul>
              </div>
            ) : null}

            {/* Roles Capability */}
            {hasPermission(sessionUser, 'roles:read') ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2.5 text-primary-600 dark:text-primary-400 font-bold text-sm">
                  <Key className="w-4 h-4" />
                  <span>Mantenedor de Roles y Permisos</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                    <span>Consulta de matriz de roles y facultades</span>
                  </li>
                  {hasPermission(sessionUser, 'roles:create') && (
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                      <span>Creación de nuevos roles de trabajo</span>
                    </li>
                  )}
                  {hasPermission(sessionUser, 'roles:edit') && (
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                      <span>Configuración y edición de privilegios</span>
                    </li>
                  )}
                  {hasPermission(sessionUser, 'roles:delete') && (
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                      <span>Eliminación de roles personalizados</span>
                    </li>
                  )}
                </ul>
              </div>
            ) : null}

            {!hasPermission(sessionUser, 'users:read') && !hasPermission(sessionUser, 'roles:read') && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2 md:col-span-2">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>Módulos de Gestión Restringidos</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tu rol actual cuenta con facultades operativas enfocadas en visualización y perfil. Los módulos de gestión de usuarios y roles están reservados según las facultades asignadas.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
