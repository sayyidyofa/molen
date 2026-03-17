-- Create tables for Molen
CREATE TABLE IF NOT EXISTS graphs (
    id VARCHAR(21) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(21) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default graph
INSERT INTO graphs (id, name, description, config_json, is_active) 
VALUES (
    'default-graph',
    'Default Fraud Detection Graph',
    'Default fraud detection configuration',
    '{"nodes": [], "edges": []}'::jsonb,
    true
) ON CONFLICT (id) DO NOTHING;
