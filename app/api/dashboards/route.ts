// app/api/raw-data/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const instruments = searchParams.getAll('instrument');
  const tests = searchParams.getAll('test');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];

  // Thêm điều kiện lọc nếu có instrument

  if (instruments.length > 0) {
    const quoted = instruments.map((i) => `'${i}'`).join(', ');
    conditions.push(`"InstrumentName" IN (${quoted})`);
  }

 if (tests.length > 0) {
    const quoted = tests.map((i) => `'${i}'`).join(', ');
    conditions.push(`"Parametershort" IN (${quoted})`);
  }
  // WHERE clause cho raw SQL
  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Raw SQL để lấy dữ liệu distinct
  const dataQuery = `
    SELECT DISTINCT "InstrumentName","Parametershort", "MaterialNumber", "Material Name", "UsageType"
    FROM "raw_data"
    ${whereSQL}
    ORDER BY "InstrumentName", "Parametershort", "Material Name"
    LIMIT ${limit}
    OFFSET ${offset};
  `;

  // Raw SQL để đếm tổng số dòng distinct
  const countQuery = `
    SELECT COUNT(*) FROM (
      SELECT DISTINCT "InstrumentName","Parametershort", "MaterialNumber", "Material Name", "UsageType"
      FROM "raw_data"
      ${whereSQL}
    ) AS subquery;
  `;

  // Thực thi truy vấn
  const dataResult = await db.execute(sql.raw(dataQuery));
  const countResult = await db.execute(sql.raw(countQuery));

  // Count
  const total = Array.isArray(countResult) && countResult.length > 0
  ? Number((countResult[0] as { count: string }).count)
  : 0;

  return NextResponse.json({ data: dataResult, total });
}
