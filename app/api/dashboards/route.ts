import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const instruments = searchParams.getAll('instrument');
  const tests = searchParams.getAll('test');
  const page = parseInt(searchParams.get('page') || '1');
  const isExportAll = searchParams.get('all') === 'true';

  const limit = 50;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];

  // Bộ lọc theo instrument
  if (instruments.length > 0) {
    const quoted = instruments.map((i) => `'${i}'`).join(', ');
    conditions.push(`"InstrumentName" IN (${quoted})`);
  }

  // Bộ lọc theo test
  if (tests.length > 0) {
    const quoted = tests.map((t) => `'${t}'`).join(', ');
    conditions.push(`"Parametershort" IN (${quoted})`);
  }

  // WHERE clause
  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Raw SQL truy vấn dữ liệu
  const baseSelect = `
    SELECT DISTINCT "InstrumentName", "Parametershort", "MaterialNumber", "Material Name", "UsageType"
    FROM "raw_data"
    ${whereSQL}
    ORDER BY "InstrumentName", "Parametershort", "Material Name"
  `;

  const dataQuery = isExportAll
    ? baseSelect
    : `${baseSelect} LIMIT ${limit} OFFSET ${offset};`;

  // Truy vấn tổng số dòng (chỉ cần nếu không export all)
  const countQuery = `
    SELECT COUNT(*) FROM (
      ${baseSelect}
    ) AS subquery;
  `;

  // Thực thi truy vấn
  const dataResult = await db.execute(sql.raw(dataQuery));
  let total = 0;

  if (!isExportAll) {
    const countResult = await db.execute(sql.raw(countQuery));
    total =
      Array.isArray(countResult) && countResult.length > 0
        ? Number((countResult[0] as { count: string }).count)
        : 0;
  }

  return NextResponse.json({
    data: dataResult,
    ...(isExportAll ? {} : { total }),
  });
}
