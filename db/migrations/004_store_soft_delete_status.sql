-- Allow SaaS tenant stores to be soft-deleted without removing related data.
-- The application maps DELETE /platform/stores/:id to status = 'deleted'.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'stores_status_saas_chk'
    ) THEN
        ALTER TABLE stores DROP CONSTRAINT stores_status_saas_chk;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'stores_status_chk'
    ) THEN
        ALTER TABLE stores DROP CONSTRAINT stores_status_chk;
    END IF;

    ALTER TABLE stores
        ADD CONSTRAINT stores_status_saas_chk
        CHECK (status IN ('active', 'suspended', 'inactive', 'deleted'));
END $$;
