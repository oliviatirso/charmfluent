CREATE TABLE IF NOT EXISTS photos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      TEXT        NOT NULL,
  storage_path  TEXT        NOT NULL,
  url           TEXT        NOT NULL,
  category      TEXT        NOT NULL CHECK (category IN ('grills', 'gems')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
