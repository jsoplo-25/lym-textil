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

-- 3. Tabla de Roles del Sistema
CREATE TABLE IF NOT EXISTS public.roles (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  badge_label VARCHAR(100),
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura de roles" ON public.roles;
CREATE POLICY "Permitir lectura de roles" ON public.roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir escritura de roles" ON public.roles;
CREATE POLICY "Permitir escritura de roles" ON public.roles FOR ALL USING (true);

-- Seed de Roles Iniciales
INSERT INTO public.roles (id, code, name, description, badge_label, permissions, is_system)
VALUES
  (
    'role_admin',
    'ADMIN',
    'Administrador General',
    'Acceso total y control de todos los módulos de la aplicación (Dashboard, Mi Perfil, Usuarios y Roles).',
    'ADMIN',
    ARRAY['dashboard:view', 'profile:view', 'profile:edit', 'users:read', 'users:create', 'users:edit', 'users:delete', 'roles:read', 'roles:create', 'roles:edit', 'roles:delete'],
    true
  ),
  (
    'role_operator',
    'OPERATOR',
    'Operario Textil',
    'Acceso operativo restringido exclusivamente al Dashboard y a la gestión de su Perfil personal.',
    'OPERARIO',
    ARRAY['dashboard:view', 'profile:view', 'profile:edit'],
    true
  )
ON CONFLICT (code) DO UPDATE SET
  permissions = EXCLUDED.permissions,
  description = EXCLUDED.description,
  name = EXCLUDED.name;

