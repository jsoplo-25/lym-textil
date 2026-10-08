import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UserPayload } from '../types';

export const generateToken = (payload: UserPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: (env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (payload: UserPayload): string => {
  return jwt.sign(
    { id: payload.id, email: payload.email, sessionId: payload.sessionId },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: (env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
    }
  );
};

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, env.JWT_SECRET) as UserPayload;
};

export const verifyRefreshToken = (token: string): { id: string; email: string; sessionId?: string } => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string; email: string; sessionId?: string };
};
