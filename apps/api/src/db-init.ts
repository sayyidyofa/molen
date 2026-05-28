import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS schemas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      version TEXT DEFAULT 'v1.0',
      status TEXT DEFAULT 'active',
      fields JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`ALTER TABLE schemas ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1.0'`;
  await sql`ALTER TABLE schemas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`;
  await sql`ALTER TABLE schemas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;

  await sql`
    CREATE TABLE IF NOT EXISTS extractors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      source_field TEXT NOT NULL,
      transformation TEXT NOT NULL,
      output_type TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      condition TEXT NOT NULL,
      anomaly_score FLOAT NOT NULL,
      action TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS models (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      model_url TEXT NOT NULL,
      output_type TEXT NOT NULL,
      version TEXT DEFAULT 'v1.0',
      accuracy FLOAT DEFAULT 95.0,
      fpr FLOAT DEFAULT 1.0,
      status TEXT DEFAULT 'training',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`ALTER TABLE models ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1.0'`;
  await sql`ALTER TABLE models ADD COLUMN IF NOT EXISTS accuracy FLOAT DEFAULT 95.0`;
  await sql`ALTER TABLE models ADD COLUMN IF NOT EXISTS fpr FLOAT DEFAULT 1.0`;
  await sql`ALTER TABLE models ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'training'`;

  await sql`
    CREATE TABLE IF NOT EXISTS orchestrator_drafts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      graph JSONB NOT NULL,
      status TEXT DEFAULT 'draft',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orchestrator_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      draft_id UUID REFERENCES orchestrator_drafts(id),
      version INTEGER NOT NULL,
      graph JSONB NOT NULL,
      committed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS deployments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      active_version_id UUID REFERENCES orchestrator_versions(id),
      deployed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rule_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      base_type TEXT NOT NULL,
      schema JSONB,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS typed_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      rule_type_id UUID REFERENCES rule_types(id),
      description TEXT,
      mode TEXT NOT NULL,
      visual_blocks JSONB,
      code_expression TEXT,
      action TEXT NOT NULL,
      priority INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  console.log('Database initialized');
  process.exit(0);
}

initDb().catch(err => {
  console.error(err);
  process.exit(1);
});
