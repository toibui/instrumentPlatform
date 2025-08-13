import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  const query = `
    SELECT DISTINCT "InstrumentName", "Parametershort"
    FROM "raw_data"
    WHERE "InstrumentName" IS NOT NULL AND "Parametershort" IS NOT NULL
    ORDER BY "InstrumentName", "Parametershort";
  `;

  const result = await db.execute(sql.raw(query));

  // 🗂️ Mapping nhóm xét nghiệm
  const groupMapping: Record<string, string> = {
    // Có thể map theo instrument hoặc test
    // Key viết in hoa để tránh phân biệt hoa thường
    'Cobas c311': 'Hóa sinh',
    'Cobas c501': 'Hóa sinh',
    'Cobas c502': 'Hóa sinh',
    'Cobas c701': 'Hóa sinh',
    'Cobas c702': 'Hóa sinh',
    'Cobas c303': 'Hóa sinh',
    'Cobas c503': 'Hóa sinh',
    'Cobas c703': 'Hóa sinh',
    'Cobas c513': 'Hóa sinh',
    'Cobas e411': 'Miễn dịch',
    'Cobas e402': 'Miễn dịch',
    'Cobas e601': 'Miễn dịch',
    'Cobas e602': 'Miễn dịch',
    'Cobas e801': 'Miễn dịch',
    // ... thêm các loại khác
  };

  const relations = result
    .filter(
      (r: Record<string, unknown>): r is { InstrumentName: string; Parametershort: string } =>
        typeof r.InstrumentName === 'string' && typeof r.Parametershort === 'string'
    )
    .flatMap(r => {
      // Tách nhiều Instrument nếu có dấu "/"
      const instruments = r.InstrumentName.split('/')
        .map(i => i.trim())
        .filter(i => i !== '');

      return instruments.map(inst => ({
        instrument: inst,
        test: r.Parametershort,
        group: groupMapping[inst] || 'Khác', // Nếu không map thì để "Khác"
      }));
    });

  return NextResponse.json(relations);
}
