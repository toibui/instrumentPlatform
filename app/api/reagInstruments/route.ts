// app/api/raw-data/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];

  // Thêm điều kiện lọc nếu có instrument
  const instruments: string[] = searchParams.getAll('instrument'); // khai báo rõ

  if (instruments.length > 0) {
    const quoted = instruments.map((i: string) => `'${i}'`).join(', ');
    conditions.push(`"InstrumentName" IN (${quoted})`);
  }

  // WHERE clause cho raw SQL
  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Raw SQL để lấy dữ liệu distinct
  const dataQuery = `
    SELECT DISTINCT "InstrumentName", "MaterialNumber", "Material Name", "UsageType"
    FROM "raw_data"
    ${whereSQL}
    ORDER BY "InstrumentName","UsageType", "Material Name"
    LIMIT ${limit}
    OFFSET ${offset};
  `;

  // Raw SQL để đếm tổng số dòng distinct
  const countQuery = `
    SELECT COUNT(*) FROM (
      SELECT DISTINCT "InstrumentName", "MaterialNumber", "Material Name", "UsageType"
      FROM "raw_data"
      ${whereSQL}
    ) AS subquery;
  `;

  // Thực thi truy vấn
  const dataResult = await db.execute(sql.raw(dataQuery));
  const countResult = await db.execute(sql.raw(countQuery));

  // Lấy tổng số từ kết quả
  type CountRow = { count: string };

  let total = 0;

  if (
    Array.isArray(countResult) &&
    countResult.length > 0 &&
    typeof (countResult[0] as Record<string, unknown>).count !== 'undefined'
  ) {
    const row = countResult[0] as CountRow;
    total = Number(row.count);
  }

  return NextResponse.json({ data: dataResult, total });
}
