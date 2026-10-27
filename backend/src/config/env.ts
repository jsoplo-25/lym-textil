import dotenv from 'dotenv';
import path from 'path';

// Load .env file in development if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const port = process.env.PORT || 4000;
const defaultApiUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;

export const env = {
  PORT: port,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_URL: process.env.API_URL || defaultApiUrl,
  FRONTEND_URL: process.env.FRONTEND_URL || '*',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'placeholder_anon_key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || 'placeholder_service_role_key',
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_textiles_lym_2026_intellecta',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_textiles_lym_2026',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Textiles L&M <no-reply@textileslym.com>',
  CLOUDFLARE_TURNSTILE_SECRET_KEY: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '',
};

