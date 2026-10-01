import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../../../entities/session/sessionSlice';
import { loginService } from '../services/login.service';
import type { LoginFormState } from '../types/login.types';

const REMEMBER_EMAIL_KEY = 'lym_remembered_email';

export const useLogin = (initialEmail = '') => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem(REMEMBER_EMAIL_KEY) || '' : '';

  const [state, setState] = useState<LoginFormState>({
    email: initialEmail || savedEmail,
    password: '',
    rememberMe: false,
    isLoading: false,
    error: null,
  });

  const setEmail = (email: string) => setState((prev) => ({ ...prev, email, error: null }));
  const setPassword = (password: string) => setState((prev) => ({ ...prev, password, error: null }));
  const setRememberMe = (rememberMe: boolean) => setState((prev) => ({ ...prev, rememberMe }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await loginService.login({
        email: state.email,
        password: state.password,
        rememberMe: state.rememberMe,
      });

      if (!data || !data.user) {
        throw new Error('La respuesta del servidor no contiene los datos del usuario.');
      }

      // Handle persistent email storage
      if (state.rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, state.email.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      dispatch(
        setCredentials({
          user: data.user,
          token: data.accessToken || data.token,
          refreshToken: data.refreshToken,
        })
      );
      navigate('/dashboard');
    } catch (err: unknown) {
      let errorMessage = 'Error al conectar con el servidor. Verifica tus credenciales.';
      if (err && typeof err === 'object') {
        const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
        errorMessage = errorObj.response?.data?.error || errorObj.message || errorMessage;
      }

      setState((prev) => ({ ...prev, error: errorMessage }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return {
    email: state.email,
    password: state.password,
    rememberMe: state.rememberMe,
    isLoading: state.isLoading,
    error: state.error,
    setEmail,
    setPassword,
    setRememberMe,
    handleSubmit,
  };
};
