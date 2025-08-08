import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get('page') || '1');
  const isExportAll = searchParams.get('all') === 'true';
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];

  // 🔍 Lọc theo instrument
  const instruments: string[] = searchParams.getAll('instrument');

  // if (instruments.length > 0) {
  //   const quoted = instruments.map((i: string) => `'${i}'`).join(', ');
  //   conditions.push(`"InstrumentName" IN (${quoted})`);
  // }

  if (instruments.length > 0) {
    const likeConditions = instruments
      .map((i: string) => `"InstrumentName" ILIKE '%${i}%'`)
      .join(' OR ');
    conditions.push(`(${likeConditions})`);
  }

  // WHERE clause
  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 🧾 Base SELECT query
  const baseSelect = `
    SELECT DISTINCT "InstrumentName", "MaterialNumber", "Material_Name", "UsageType"
    FROM "raw_data"
    ${whereSQL}
    ORDER BY "InstrumentName", "UsageType", "Material_Name"
  `;

  // 📦 Query dữ liệu
  const dataQuery = isExportAll
    ? baseSelect
    : `${baseSelect} LIMIT ${limit} OFFSET ${offset}`;

  const dataResult = await db.execute(sql.raw(dataQuery));

  // 🔢 Nếu không phải export all thì mới cần đếm total
  let total = 0;
  if (!isExportAll) {
    const countQuery = `
      SELECT COUNT(*) FROM (
        ${baseSelect}
      ) AS subquery;
    `;
    const countResult = await db.execute(sql.raw(countQuery));

    type CountRow = { count: string };
    if (
      Array.isArray(countResult) &&
      countResult.length > 0 &&
      typeof (countResult[0] as Record<string, unknown>).count !== 'undefined'
    ) {
      const row = countResult[0] as CountRow;
      total = Number(row.count);
    }
  }

  return NextResponse.json(
    isExportAll ? { data: dataResult } : { data: dataResult, total }
  );
}
