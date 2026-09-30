import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../../../entities/session/sessionSlice';
import { loginService } from '../services/login.service';
import type { LoginFormState } from '../types/login.types';

export const useLogin = (initialEmail = 'jhon.soplopuco9cibertec@gmail.com') => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [state, setState] = useState<LoginFormState>({
    email: initialEmail,
    password: '123456',
    rememberMe: true,
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

      dispatch(
        setCredentials({
          user: data.user,
          token: data.accessToken || data.token,
          refreshToken: data.refreshToken,
        })
      );
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error ||
        err?.message ||
        'Error al conectar con el servidor. Verifica tus credenciales.';

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
