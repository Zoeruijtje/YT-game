import fs from 'node:fs';
import path from 'node:path';
import { openDatabase } from './client.js';
import { runMigrations } from './migrate.js';

const command = process.argv[2] ?? 'migrate';
const dataDir = path.resolve(process.env.YT_GAME_DATA_DIR ?? './data');
const databasePath = path.join(dataDir, 'yt-game.sqlite');
if (command === 'reset') {
  for (const suffix of ['', '-shm', '-wal']) fs.rmSync(`${databasePath}${suffix}`, { force: true });
}
const context = openDatabase(databasePath);
const applied = runMigrations(context);
console.log(JSON.stringify({ command, databasePath, applied }, null, 2));
context.sqlite.close();
