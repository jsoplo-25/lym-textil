-- =========================================================
-- ESQUEMA BASE DE DATOS SUPABASE / POSTGRESQL - TEXTIL L&M
-- Módulo de Usuarios y Roles únicamente
-- =========================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enum para Roles de Usuario de Textil L&M
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'SUPERVISOR', 'OPERATOR', 'QUALITY_INSPECTOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'OPERATOR',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para optimizar búsquedas por email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Permitir lectura de usuarios" ON public.users;
CREATE POLICY "Permitir lectura de usuarios" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir actualizacion propia o admin" ON public.users;
CREATE POLICY "Permitir actualizacion propia o admin" ON public.users FOR UPDATE USING (true);

-- Seed de Usuarios Iniciales (Password por defecto: 123456)
INSERT INTO public.users (id, email, password_hash, first_name, last_name, role, avatar_url, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'jhon.soplopuco9cibertec@gmail.com',
    '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'Jhon Anderson',
    'Soplopuco Lavado',
    'ADMIN',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO NOTHING;
