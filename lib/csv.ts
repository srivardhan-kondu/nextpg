/**
 * Minimal RFC-4180 CSV parser.
 *
 * Written by hand rather than pulled from npm because the import surface is
 * admin-only and narrow: we need quoted fields, escaped quotes and CRLF, and
 * nothing else. Fewer dependencies on a path that writes to the cutoff table.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  // Strip a UTF-8 BOM — Excel writes one and it corrupts the first header.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // consume the escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  // Flush the trailing field/row when the file has no final newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

export interface CsvTable {
  headers: string[];
  rows: Record<string, string>[];
}

/** Parses with the first row as headers, normalised to lowercase snake_case. */
export function parseCsvTable(input: string): CsvTable {
  const raw = parseCsv(input);
  if (raw.length === 0) return { headers: [], rows: [] };

  const headers = raw[0]!.map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));

  const rows = raw.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? '').trim();
    });
    return record;
  });

  return { headers, rows };
}

export function toCsv(rows: Record<string, unknown>[], headers?: string[]): string {
  if (rows.length === 0) return '';
  const cols = headers ?? Object.keys(rows[0]!);

  const escape = (value: unknown): string => {
    const text = value == null ? '' : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [cols.join(','), ...rows.map((row) => cols.map((col) => escape(row[col])).join(','))].join('\n');
}
