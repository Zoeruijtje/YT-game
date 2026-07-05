import fs from 'node:fs';
import path from 'node:path';

const roots = ['apps', 'packages', 'scripts', 'tests', 'docs', 'fixtures', '.github'];
const rootFiles = [
  '.env.example',
  '.gitignore',
  '.nvmrc',
  '.prettierignore',
  '.prettierrc.json',
  'README.md',
  'eslint.config.mjs',
  'package.json',
  'playwright.config.ts',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'vitest.config.ts',
];
const supported = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.md', '.yaml', '.yml', '.css', '.html', '.sql', '']);
const problems = [];

function check(file) {
  const extension = path.extname(file);
  if (!supported.has(extension)) return;
  const content = fs.readFileSync(file, 'utf8');
  if (!content.endsWith('\n')) problems.push(`${file}: missing final newline`);
  content.split(/\r?\n/).forEach((line, index) => {
    if (/[ \t]+$/.test(line)) problems.push(`${file}:${index + 1}: trailing whitespace`);
    if (line.includes('\t') && !file.endsWith('.md')) problems.push(`${file}:${index + 1}: tab character`);
  });
}

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else check(target);
  }
}

roots.forEach(walk);
rootFiles.filter(fs.existsSync).forEach(check);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('Formatting hygiene check passed.');
