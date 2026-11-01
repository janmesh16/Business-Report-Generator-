CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  business_name TEXT,
  decision_context TEXT,
  status TEXT CHECK(status IN ('pending', 'parsing', 'analysing', 'writing', 'completed', 'failed')) DEFAULT 'pending',
  progress_step TEXT DEFAULT 'Initializing pipeline...',
  error_message TEXT,
  parsed_sources_json TEXT NOT NULL DEFAULT '[]',
  computed_stats_json TEXT NOT NULL DEFAULT '{}',
  report_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS share_tokens (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  is_revoked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_share_token ON share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_report_status ON reports(status);

