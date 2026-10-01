import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { LoginCredentials, LoginResponseData } from '../types/login.types';

export const loginService = {
  async login(credentials: LoginCredentials): Promise<LoginResponseData> {
    const response = await axiosInstance.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
      rememberMe: credentials.rememberMe,
    });

    return response.data.data;
  },

  async logout(): Promise<void> {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {
      // Ignorar error si el backend no responde, continuar con limpieza local
    }
  },
};
