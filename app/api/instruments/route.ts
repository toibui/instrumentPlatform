// app/api/raw-data/instruments/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db'; // hoặc '@/lib/db'
import { sql } from 'drizzle-orm';
import {instrumentGroups} from '../../../utils/instrumentGroups';

// type Group = 'Hóa sinh' | 'Miễn dịch' | 'Điện giải';

// Định nghĩa kiểu dữ liệu cho từng row
interface InstrumentRow extends Record<string, unknown> {
  InstrumentName: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tests = searchParams.getAll('test');
  const conditions: string[] = ['"Parametershort" IS NOT NULL'];

  if (tests.length > 0) {
    const quoted = tests.map((i) => `'${i}'`).join(', ');
    conditions.push(`"Parametershort" IN (${quoted})`);
  }

  const whereSQL =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT DISTINCT TRIM(value) AS "InstrumentName"
    FROM (
      SELECT unnest(string_to_array("InstrumentName", '/')) AS value
      FROM "raw_data"
      ${whereSQL}
    ) AS splitted
    ORDER BY "InstrumentName" ASC;
  `;

  // Khai báo kiểu dữ liệu trả về
  const execResult = await db.execute<InstrumentRow>(sql.raw(query));

  // Đảm bảo rows là mảng đúng kiểu
  const rows: InstrumentRow[] = Array.isArray(execResult)
    ? execResult
    : Array.isArray((execResult as { rows: InstrumentRow[] })?.rows)
    ? (execResult as { rows: InstrumentRow[] }).rows
    : [];

  const namesWithGroup = rows.map((r) => ({
    name: r.InstrumentName.trim(),
    group: instrumentGroups[r.InstrumentName.trim()] ?? null,
  }));

  return NextResponse.json(namesWithGroup);
}