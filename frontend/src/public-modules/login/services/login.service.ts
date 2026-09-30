import { axiosInstance } from '../../../shared/api/axiosInstance';
import type { LoginCredentials, LoginResponseData } from '../types/login.types';

export const loginService = {
  async login(credentials: LoginCredentials): Promise<LoginResponseData> {
    const response = await axiosInstance.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });

    return response.data.data;
  },
};
