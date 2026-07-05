import fs from 'node:fs';
import path from 'node:path';
import type { DatabaseContext } from './client.js';

export function runMigrations(context: DatabaseContext, migrationsDir = resolveMigrationsDir()): string[] {
  context.sqlite.exec('CREATE TABLE IF NOT EXISTS _yt_game_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const applied = new Set(
    context.sqlite.prepare('SELECT name FROM _yt_game_migrations ORDER BY name').all().map((row) => (row as { name: string }).name),
  );
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
  const newlyApplied: string[] = [];
  const insert = context.sqlite.prepare('INSERT INTO _yt_game_migrations(name, applied_at) VALUES (?, ?)');
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    context.sqlite.transaction(() => {
      context.sqlite.exec(sql);
      insert.run(file, new Date().toISOString());
    })();
    newlyApplied.push(file);
  }
  return newlyApplied;
}

export function resolveMigrationsDir(): string {
  return path.resolve(process.cwd(), 'packages/database/migrations');
}
