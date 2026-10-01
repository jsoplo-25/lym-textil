"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env file in development if present
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const port = process.env.PORT || 4000;
const defaultApiUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
exports.env = {
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
};
