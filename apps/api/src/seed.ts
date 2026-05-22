import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function seed() {
  const [schema] = await sql`
    INSERT INTO schemas (name, fields)
    VALUES ('Stripe Webhook', '{"amount": "NUMBER", "currency": "STRING"}'::jsonb)
    RETURNING *
  `;

  const [extractor] = await sql`
    INSERT INTO extractors (name, source_field, transformation, output_type)
    VALUES ('Amount Extractor', 'amount', 'x', 'NUMBER')
    RETURNING *
  `;

  const [rule] = await sql`
    INSERT INTO rules (name, condition, anomaly_score, action)
    VALUES ('High Amount', 'amount > 1000', 100, 'BLOCK')
    RETURNING *
  `;

  const [draft] = await sql`
    INSERT INTO drafts (name, graph)
    VALUES ('High Value Check', '{"nodes": [{"id": "1", "type": "INPUT", "config": {}}, {"id": "2", "type": "RULE", "config": {}}], "edges": [{"id": "e1-2", "source": "1", "target": "2"}]}'::jsonb)
    RETURNING *
  `;

  const [version] = await sql`
    INSERT INTO committed_versions (draft_id, version, graph)
    VALUES (${draft.id}, 1, ${draft.graph})
    RETURNING *
  `;

  console.log('Seeded data:', { schema, extractor, rule, draft, version });
  process.exit(0);
}

seed().catch(console.error);
