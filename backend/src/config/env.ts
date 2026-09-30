import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'placeholder_anon_key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || 'placeholder_service_role_key',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_textiles_lym_2026_intellecta',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_textiles_lym_2026',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
