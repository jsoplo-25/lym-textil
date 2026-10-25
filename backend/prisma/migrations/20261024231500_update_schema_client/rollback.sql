-- ==============================================================================
-- ROLLBACK: 20261024231500_update_schema_client
-- Description: Script reversible (DOWN) para volver al estado anterior de la base de datos
-- ==============================================================================

-- 1. ROLLBACK PRODUCTION_ROLLS
ALTER TABLE public.production_rolls DROP CONSTRAINT IF EXISTS chk_rolls_weight_positive;
DROP INDEX IF EXISTS idx_rolls_batch_roll_number;
ALTER TABLE public.production_rolls ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE public.production_rolls ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE public.production_rolls ALTER COLUMN start_operator_id DROP NOT NULL;
ALTER TABLE public.production_rolls DROP COLUMN IF EXISTS end_operator_id;
ALTER TABLE public.production_rolls DROP COLUMN IF EXISTS start_operator_id;

-- 2. ROLLBACK BATCH_STATUS_LOGS
DROP TABLE IF EXISTS public.batch_status_logs;

-- 3. ROLLBACK PRODUCTION_BATCHES
ALTER TABLE public.production_batches ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE public.production_batches ALTER COLUMN machine_id DROP NOT NULL;
ALTER TABLE public.production_batches ALTER COLUMN supplier_id DROP NOT NULL;
DROP INDEX IF EXISTS idx_production_batches_batch_number;

-- 4. ROLLBACK MACHINES
ALTER TABLE public.machines DROP COLUMN IF EXISTS design_types;

-- 5. ROLLBACK SUPPLIERS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'yarn_types' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS yarn_types_str TEXT;
    UPDATE public.suppliers SET yarn_types_str = array_to_string(yarn_types, ', ');
    ALTER TABLE public.suppliers DROP COLUMN yarn_types;
    ALTER TABLE public.suppliers RENAME COLUMN yarn_types_str TO yarn_types;
  END IF;
END $$;

-- 6. ROLLBACK USERS
DROP INDEX IF EXISTS idx_users_worker_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS last_login_at;
ALTER TABLE public.users DROP COLUMN IF EXISTS status;
ALTER TABLE public.users DROP COLUMN IF EXISTS job_title;
ALTER TABLE public.users DROP COLUMN IF EXISTS phone;
ALTER TABLE public.users DROP COLUMN IF EXISTS worker_id;
