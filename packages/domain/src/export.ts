export function escapeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  const formulaSafe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(formulaSafe) ? `"${formulaSafe.replace(/"/g, '""')}"` : formulaSafe;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  const keys = columns ?? [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const lines = [keys.map(escapeCsvCell).join(',')];
  for (const row of rows) lines.push(keys.map((key) => escapeCsvCell(row[key])).join(','));
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function slugify(value: string): string {
  const result = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  return result || 'collection';
}
