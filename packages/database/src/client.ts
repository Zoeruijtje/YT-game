import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

export interface DatabaseContext {
  sqlite: Database.Database;
  db: BetterSQLite3Database<typeof schema>;
  databasePath: string;
}

export function openDatabase(databasePath: string): DatabaseContext {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const sqlite = new Database(databasePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  const db = drizzle(sqlite, { schema });
  return { sqlite, db, databasePath };
}

export function validateDatabaseFile(databasePath: string): { valid: boolean; reason?: string } {
  try {
    const sqlite = new Database(databasePath, { readonly: true, fileMustExist: true });
    try {
      const integrity = sqlite.pragma('integrity_check', { simple: true });
      const required = sqlite.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name IN ('video_collections','comments','comment_snapshots','import_runs','quiz_cases','score_events')").get() as { count: number };
      if (integrity !== 'ok') return { valid: false, reason: `SQLite integrity check returned ${String(integrity)}` };
      if (required.count !== 6) return { valid: false, reason: 'Required YT-game tables are missing.' };
      return { valid: true };
    } finally {
      sqlite.close();
    }
  } catch (error) {
    return { valid: false, reason: error instanceof Error ? error.message : 'Unknown database validation error.' };
  }
}
