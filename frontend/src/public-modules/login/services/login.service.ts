import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { LoginCredentials, LoginResponseData, ResetPasswordPayload } from '../types/login.types';

export const loginService = {
  async login(credentials: LoginCredentials): Promise<LoginResponseData> {
    const response = await axiosInstance.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
      rememberMe: credentials.rememberMe,
      turnstileToken: credentials.turnstileToken,
    });

    if (!response.data || typeof response.data !== 'object' || !response.data.data) {
      throw new Error('Respuesta inválida del servidor. Verifica la conexión con el backend.');
    }

    return response.data.data;
  },

  async logout(): Promise<void> {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {
      // Ignorar error si el backend no responde, continuar con limpieza local
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data;
  },

  async verifyResetCode(email: string, code: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.post('/auth/verify-reset-code', { email, code });
    return response.data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.post('/auth/reset-password', payload);
    return response.data;
  },
};
