import { describe, expect, it } from 'vitest';
import { parseCsv, parseCsvTable, toCsv } from '@/lib/csv';

describe('parseCsv', () => {
  it('parses a simple grid', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('handles quoted fields containing commas', () => {
    expect(parseCsv('name,city\n"Smith, John",Delhi')).toEqual([
      ['name', 'city'],
      ['Smith, John', 'Delhi'],
    ]);
  });

  it('handles escaped quotes', () => {
    expect(parseCsv('a\n"He said ""hi"""')).toEqual([['a'], ['He said "hi"']]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('handles newlines inside quoted fields', () => {
    expect(parseCsv('a\n"line1\nline2"')).toEqual([['a'], ['line1\nline2']]);
  });

  it('strips a UTF-8 BOM so the first header is not corrupted', () => {
    const [header] = parseCsv('﻿name,state\nA,B');
    expect(header?.[0]).toBe('name');
  });

  it('drops entirely blank rows', () => {
    expect(parseCsv('a,b\n\n1,2\n')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('returns nothing for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

describe('parseCsvTable', () => {
  it('normalises headers to snake_case', () => {
    const table = parseCsvTable('College Name,Closing Rank\nAIIMS,142');
    expect(table.headers).toEqual(['college_name', 'closing_rank']);
    expect(table.rows[0]).toEqual({ college_name: 'AIIMS', closing_rank: '142' });
  });

  it('fills missing trailing cells with empty strings', () => {
    const table = parseCsvTable('a,b,c\n1,2');
    expect(table.rows[0]).toEqual({ a: '1', b: '2', c: '' });
  });
});

describe('toCsv', () => {
  it('round-trips values needing escapes', () => {
    const csv = toCsv([{ name: 'Smith, John', note: 'said "hi"' }]);
    const parsed = parseCsv(csv);
    expect(parsed[1]).toEqual(['Smith, John', 'said "hi"']);
  });

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('');
  });
});
