-- ==============================================================================
-- MIGRATION: 20261024231500_update_schema_client
-- Description: Actualización al esquema objetivo del cliente manteniendo campos en inglés.
-- ==============================================================================

-- 1. EXTENSIÓN UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. MODIFICACIONES EN TABLA USERS
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS worker_id VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS job_title VARCHAR(150);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Backfill para worker_id en usuarios existentes si estuviera NULL
WITH ranked_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM public.users
)
UPDATE public.users u
SET worker_id = 'USR-' || LPAD(r.row_num::text, 3, '0')
FROM ranked_users r
WHERE u.id = r.id AND (u.worker_id IS NULL OR u.worker_id = '');

-- Restricciones worker_id
ALTER TABLE public.users ALTER COLUMN worker_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_worker_id ON public.users(worker_id);

-- Backfill para job_title (Cargo) a partir de description de la tabla roles
UPDATE public.users u
SET job_title = r.description
FROM public.roles r
WHERE UPPER(u.role) = UPPER(r.code) OR u.role = r.id;

-- 3. MODIFICACIONES EN TABLA SUPPLIERS
-- Convertir yarn_types a array TEXT[]
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'yarn_types' AND data_type = 'character varying'
  ) OR EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'yarn_types' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS yarn_types_arr TEXT[] DEFAULT '{}';
    UPDATE public.suppliers 
    SET yarn_types_arr = CASE 
      WHEN yarn_types IS NOT NULL AND TRIM(yarn_types) <> '' THEN string_to_array(TRIM(yarn_types), ',')
      ELSE '{}'
    END;
    ALTER TABLE public.suppliers DROP COLUMN yarn_types;
    ALTER TABLE public.suppliers RENAME COLUMN yarn_types_arr TO yarn_types;
  ELSE
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS yarn_types TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- 4. MODIFICACIONES EN TABLA MACHINES
ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS design_types TEXT[] DEFAULT '{}';

-- 5. MODIFICACIONES EN TABLA PRODUCTION_BATCHES
-- Restricción UNIQUE en batch_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_production_batches_batch_number ON public.production_batches(batch_number);

-- Backfill para lotes que tuvieran supplier_id o machine_id NULL antes de aplicar NOT NULL
UPDATE public.production_batches
SET supplier_id = (SELECT id FROM public.suppliers ORDER BY created_at ASC LIMIT 1)
WHERE supplier_id IS NULL;

UPDATE public.production_batches
SET machine_id = (SELECT id FROM public.machines ORDER BY created_at ASC LIMIT 1)
WHERE machine_id IS NULL;

UPDATE public.production_batches
SET start_date = created_at
WHERE start_date IS NULL;

-- Asegurar NOT NULL en supplier_id, machine_id y start_date
ALTER TABLE public.production_batches ALTER COLUMN supplier_id SET NOT NULL;
ALTER TABLE public.production_batches ALTER COLUMN machine_id SET NOT NULL;
ALTER TABLE public.production_batches ALTER COLUMN start_date SET NOT NULL;

-- 6. TABLA DE TRACKING DE ESTADOS DE LOTE (PAUSAS, AUDITORÍA)
-- Nota: id de production_batches y users son de tipo TEXT en Prisma
CREATE TABLE IF NOT EXISTS public.batch_status_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  batch_id TEXT NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  changed_by_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batch_status_logs_batch_id ON public.batch_status_logs(batch_id);

-- 7. MODIFICACIONES EN TABLA PRODUCTION_ROLLS
ALTER TABLE public.production_rolls ADD COLUMN IF NOT EXISTS start_operator_id TEXT REFERENCES public.users(id) ON DELETE RESTRICT;
ALTER TABLE public.production_rolls ADD COLUMN IF NOT EXISTS end_operator_id TEXT REFERENCES public.users(id) ON DELETE SET NULL;

-- Backfill de operadores a partir de los nombres existentes
UPDATE public.production_rolls r
SET start_operator_id = u.id
FROM public.users u
WHERE r.start_operator_id IS NULL
  AND r.start_operator IS NOT NULL
  AND TRIM(LOWER(r.start_operator)) = TRIM(LOWER(u.first_name || ' ' || u.last_name));

UPDATE public.production_rolls r
SET end_operator_id = u.id
FROM public.users u
WHERE r.end_operator_id IS NULL
  AND r.end_operator IS NOT NULL
  AND TRIM(LOWER(r.end_operator)) = TRIM(LOWER(u.first_name || ' ' || u.last_name));

-- Respaldo de seguridad si algún rollo no coincidió exactamente
UPDATE public.production_rolls
SET start_operator_id = (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1)
WHERE start_operator_id IS NULL;

-- Asignar valores por defecto a start_date y start_time si hubiera algún nulo antes de volverlo NOT NULL
UPDATE public.production_rolls
SET start_date = TO_CHAR(created_at, 'YYYY-MM-DD')
WHERE start_date IS NULL OR start_date = '';

UPDATE public.production_rolls
SET start_time = TO_CHAR(created_at, 'HH24:MI')
WHERE start_time IS NULL OR start_time = '';

-- Aplicar NOT NULL a operario de inicio, fecha de inicio y hora de inicio
ALTER TABLE public.production_rolls ALTER COLUMN start_operator_id SET NOT NULL;
ALTER TABLE public.production_rolls ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE public.production_rolls ALTER COLUMN start_time SET NOT NULL;

-- Restricción UNIQUE de número de rollo dentro del lote
CREATE UNIQUE INDEX IF NOT EXISTS idx_rolls_batch_roll_number ON public.production_rolls(batch_id, roll_number);

-- Restricción CHECK de peso no negativo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_rolls_weight_positive'
  ) THEN
    ALTER TABLE public.production_rolls 
    ADD CONSTRAINT chk_rolls_weight_positive CHECK (weight IS NULL OR weight >= 0);
  END IF;
END $$;
