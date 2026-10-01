import { CookieOptions, Response } from 'express';
import { env } from '../../config/env';

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export const getAuthCookieOptions = (isRememberMe = true, isRefresh = false): CookieOptions => {
  const isProd = env.NODE_ENV === 'production';

  // Access token: 24 hours (or 2 hours if not rememberMe)
  // Refresh token: 30 days (or 7 days if not rememberMe)
  const maxAge = isRefresh
    ? isRememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000
    : isRememberMe
    ? 24 * 60 * 60 * 1000
    : 2 * 60 * 60 * 1000;

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge,
  };
};

export const getClearCookieOptions = (): CookieOptions => {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
};

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  rememberMe = true
): void => {
  res.cookie(
    COOKIE_NAMES.ACCESS_TOKEN,
    tokens.accessToken,
    getAuthCookieOptions(rememberMe, false)
  );
  res.cookie(
    COOKIE_NAMES.REFRESH_TOKEN,
    tokens.refreshToken,
    getAuthCookieOptions(rememberMe, true)
  );
};

export const clearAuthCookies = (res: Response): void => {
  const clearOpts = getClearCookieOptions();
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, clearOpts);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, clearOpts);
};
