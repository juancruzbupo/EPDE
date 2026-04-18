-- Reshape ProfessionalSpecialty enum for Argentina reality (ADR-018 revision).
--
-- Changes:
-- 1. Split PLUMBER_GASFITTER into PLUMBER + GASFITTER (they're distinct matrículas in AR).
--    Existing assignments duplicate: one row stays as PLUMBER, a new row is created as
--    GASFITTER (non-primary). Admin can reconfigure primary afterwards.
-- 2. Rename FIRE_SAFETY → EXTINGUISHER_SERVICE (more specific for the actual service).
-- 3. Drop DOCUMENTATION_NORMATIVE — absorbed by ARCHITECT_ENGINEER. Dedupe if a pro
--    already had both.
-- 4. Add new specialties: MASON, LOCKSMITH, GLAZIER, IRONWORKER, DRAIN_CLEANER, DRYWALL_INSTALLER.
--
-- Strategy: convert column to TEXT, mutate values, convert back to new enum.
-- This avoids ALTER TYPE ADD VALUE (can't run in transactions) and enum rename dance.

-- 1. Convert enum column to TEXT temporarily
ALTER TABLE "ProfessionalSpecialtyAssignment"
  ALTER COLUMN "specialty" TYPE TEXT;

-- 2. Dedupe: if a pro has both ARCHITECT_ENGINEER + DOCUMENTATION_NORMATIVE, drop the latter
DELETE FROM "ProfessionalSpecialtyAssignment" psa1
WHERE psa1."specialty" = 'DOCUMENTATION_NORMATIVE'
  AND EXISTS (
    SELECT 1 FROM "ProfessionalSpecialtyAssignment" psa2
    WHERE psa2."professionalId" = psa1."professionalId"
      AND psa2."specialty" = 'ARCHITECT_ENGINEER'
  );

-- 3. Convert DOCUMENTATION_NORMATIVE → ARCHITECT_ENGINEER
UPDATE "ProfessionalSpecialtyAssignment"
SET "specialty" = 'ARCHITECT_ENGINEER'
WHERE "specialty" = 'DOCUMENTATION_NORMATIVE';

-- 4. Rename FIRE_SAFETY → EXTINGUISHER_SERVICE
UPDATE "ProfessionalSpecialtyAssignment"
SET "specialty" = 'EXTINGUISHER_SERVICE'
WHERE "specialty" = 'FIRE_SAFETY';

-- 5. Split PLUMBER_GASFITTER: insert a GASFITTER row (non-primary) for each existing
INSERT INTO "ProfessionalSpecialtyAssignment" ("id", "professionalId", "specialty", "isPrimary")
SELECT gen_random_uuid(), "professionalId", 'GASFITTER', false
FROM "ProfessionalSpecialtyAssignment"
WHERE "specialty" = 'PLUMBER_GASFITTER';

-- 6. Update existing PLUMBER_GASFITTER rows to PLUMBER (keeps original isPrimary)
UPDATE "ProfessionalSpecialtyAssignment"
SET "specialty" = 'PLUMBER'
WHERE "specialty" = 'PLUMBER_GASFITTER';

-- 7. Create new enum type with final value set
CREATE TYPE "ProfessionalSpecialty_new" AS ENUM (
  'PLUMBER',
  'GASFITTER',
  'ELECTRICIAN',
  'ARCHITECT_ENGINEER',
  'MASON',
  'ROOFER_WATERPROOFER',
  'HVAC_TECHNICIAN',
  'PEST_CONTROL',
  'EXTINGUISHER_SERVICE',
  'DRAIN_CLEANER',
  'PAINTER',
  'CARPENTER',
  'LANDSCAPER',
  'SOLAR_SPECIALIST',
  'WATER_TECHNICIAN',
  'LOCKSMITH',
  'GLAZIER',
  'IRONWORKER',
  'DRYWALL_INSTALLER'
);

-- 8. Cast the text column to the new enum type
ALTER TABLE "ProfessionalSpecialtyAssignment"
  ALTER COLUMN "specialty" TYPE "ProfessionalSpecialty_new"
  USING "specialty"::"ProfessionalSpecialty_new";

-- 9. Drop the old enum type and rename the new one
DROP TYPE "ProfessionalSpecialty";
ALTER TYPE "ProfessionalSpecialty_new" RENAME TO "ProfessionalSpecialty";
