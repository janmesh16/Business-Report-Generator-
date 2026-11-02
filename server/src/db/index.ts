import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: DatabaseSync;

export function getDb(): DatabaseSync {
  if (!db) {
    const dbDir = path.dirname(config.databasePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    db = new DatabaseSync(config.databasePath);
    initDb();
  }
  return db;
}

export function initDb() {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      business_name TEXT,
      decision_context TEXT,
      prompt_version TEXT DEFAULT 'v3',
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
  `;
  db.exec(schemaSql);

  // Safe migration for existing DB files
  try {
    db.exec("ALTER TABLE reports ADD COLUMN prompt_version TEXT DEFAULT 'v3'");
  } catch (e) {
    // Column already exists
  }
}

export interface ReportRecord {
  id: string;
  title: string;
  business_name: string | null;
  decision_context: string | null;
  prompt_version?: string;
  status: 'pending' | 'parsing' | 'analysing' | 'writing' | 'completed' | 'failed';
  progress_step: string;
  error_message: string | null;
  parsed_sources_json: string;
  computed_stats_json: string;
  report_json: string | null;
  created_at: string;
  updated_at: string;
}

export const dbService = {
  createReport(data: {
    id: string;
    title: string;
    businessName?: string;
    decisionContext?: string;
    promptVersion?: string;
  }) {
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO reports (id, title, business_name, decision_context, prompt_version, status, progress_step)
      VALUES (?, ?, ?, ?, ?, 'pending', 'Ingestion queued...')
    `);
    stmt.run(data.id, data.title, data.businessName || null, data.decisionContext || null, data.promptVersion || 'v3');
    return this.getReport(data.id);
  },

  updateStatus(
    id: string,
    status: 'pending' | 'parsing' | 'analysing' | 'writing' | 'completed' | 'failed',
    progressStep?: string,
    errorMessage?: string
  ) {
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE reports 
      SET status = ?, 
          progress_step = COALESCE(?, progress_step), 
          error_message = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, progressStep || null, errorMessage || null, id);
  },

  completeReport(
    id: string,
    parsedSources: any[],
    computedStats: any,
    reportJson: any
  ) {
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE reports 
      SET status = 'completed',
          progress_step = 'Report completed successfully',
          parsed_sources_json = ?,
          computed_stats_json = ?,
          report_json = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      JSON.stringify(parsedSources),
      JSON.stringify(computedStats),
      JSON.stringify(reportJson),
      id
    );
  },

  getReport(id: string): ReportRecord | null {
    const database = getDb();
    const row = database.prepare('SELECT * FROM reports WHERE id = ?').get(id);
    return (row as unknown as ReportRecord) || null;
  },

  getAllReports(): (ReportRecord & { share_token: string | null; is_revoked: number | null })[] {
    const database = getDb();
    const rows = database.prepare(`
      SELECT r.*, s.token as share_token, s.is_revoked
      FROM reports r
      LEFT JOIN share_tokens s ON r.id = s.report_id AND s.is_revoked = 0
      ORDER BY r.created_at DESC
    `).all();
    return rows as any;
  },

  deleteReport(id: string) {
    const database = getDb();
    const stmt = database.prepare('DELETE FROM reports WHERE id = ?');
    stmt.run(id);
    return true;
  },

  createOrGetShareToken(reportId: string): { token: string; isNew: boolean } {
    const database = getDb();
    const existing = database.prepare(`
      SELECT token FROM share_tokens WHERE report_id = ? AND is_revoked = 0
    `).get(reportId) as { token: string } | undefined;

    if (existing) {
      return { token: existing.token, isNew: false };
    }

    const token = crypto.randomBytes(16).toString('hex');
    const id = crypto.randomUUID();

    database.prepare(`
      INSERT INTO share_tokens (id, report_id, token, is_revoked)
      VALUES (?, ?, ?, 0)
    `).run(id, reportId, token);

    return { token, isNew: true };
  },

  revokeShareToken(reportId: string): boolean {
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE share_tokens SET is_revoked = 1 WHERE report_id = ?
    `);
    stmt.run(reportId);
    return true;
  },

  getReportByShareToken(token: string): ReportRecord | null {
    const database = getDb();
    const row = database.prepare(`
      SELECT r.* 
      FROM reports r
      JOIN share_tokens s ON r.id = s.report_id
      WHERE s.token = ? AND s.is_revoked = 0 AND r.status = 'completed'
    `).get(token) as unknown as ReportRecord | undefined;

    return row || null;
  }
};
