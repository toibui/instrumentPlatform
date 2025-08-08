// app/api/raw-data/instruments/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tests = searchParams.getAll('test');
  const conditions: string[] = ['"Parametershort" IS NOT NULL'];

  // Thêm điều kiện lọc theo test (Parametershort) nếu có
  if (tests.length > 0) {
    const quoted = tests.map((i) => `'${i}'`).join(', ');
    conditions.push(`"Parametershort" IN (${quoted})`);
  }

  // Ghép điều kiện WHERE
  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Truy vấn raw SQL để lấy danh sách InstrumentName duy nhất sau khi tách dấu '/'
  const query = `
    SELECT DISTINCT TRIM(value) AS "InstrumentName"
    FROM (
      SELECT unnest(string_to_array("InstrumentName", '/')) AS value
      FROM "raw_data"
      ${whereSQL}
    ) AS splitted
    ORDER BY "InstrumentName" ASC;
  `;

  const result = await db.execute(sql.raw(query));

  // Trích mảng string ra từ kết quả
  const names = result
    .map((r: Record<string, unknown>) => r.InstrumentName)
    .filter((n): n is string => typeof n === 'string');

  
  return NextResponse.json(names);
}
