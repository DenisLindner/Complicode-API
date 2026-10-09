-- Challenges become a structured document stored as JSON. Challenges created
-- with the old layout (Contexto, Desafio, Stack e Entregas) are converted.

-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "content" JSONB,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "projectName" TEXT,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "challenge_versions" ADD COLUMN     "content" JSONB,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "projectName" TEXT,
ADD COLUMN     "summary" TEXT;

-- Converts the old columns into the new document
CREATE FUNCTION pg_temp.legacy_challenge_content(
  context TEXT,
  description TEXT,
  technologies TEXT[],
  deliverables TEXT[]
) RETURNS JSONB LANGUAGE sql AS $$
  SELECT jsonb_build_object(
    'context', to_jsonb(regexp_split_to_array(btrim(context), '\n\s*\n')),
    'functionalRequirements', jsonb_build_array(
      jsonb_build_object('title', 'Desafio', 'description', description, 'details', '[]'::jsonb)
    ),
    'nonFunctionalRequirements', '[]'::jsonb,
    'technologies', jsonb_build_array(jsonb_build_object(
      'category', 'Stack',
      'items', COALESCE(
        (SELECT jsonb_agg(jsonb_build_object('name', name, 'purpose', '')) FROM unnest(technologies) AS name),
        '[]'::jsonb
      )
    )),
    'deliverables', to_jsonb(COALESCE(deliverables, '{}')),
    'deadline', '',
    'implementationGuide', '[]'::jsonb,
    'evaluationCriteria', '[]'::jsonb,
    'folderStructure', '',
    'closingNote', ''
  )
$$;

UPDATE "challenges"
SET "projectName" = "title",
    "summary" = left(split_part(btrim("context"), E'\n', 1), 280),
    "content" = pg_temp.legacy_challenge_content("context", "description", "technologies", "deliverables")
WHERE "title" IS NOT NULL;

UPDATE "challenge_versions"
SET "projectName" = "title",
    "industry" = 'Não informado',
    "summary" = left(split_part(btrim("context"), E'\n', 1), 280),
    "content" = pg_temp.legacy_challenge_content("context", "description", "technologies", "deliverables");

-- AlterTable
ALTER TABLE "challenges" DROP COLUMN "context",
DROP COLUMN "deliverables",
DROP COLUMN "description",
DROP COLUMN "technologies";

-- AlterTable
ALTER TABLE "challenge_versions" DROP COLUMN "context",
DROP COLUMN "deliverables",
DROP COLUMN "description",
DROP COLUMN "technologies",
ALTER COLUMN "content" SET NOT NULL,
ALTER COLUMN "industry" SET NOT NULL,
ALTER COLUMN "projectName" SET NOT NULL,
ALTER COLUMN "summary" SET NOT NULL;
