import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const instruments = searchParams.getAll('instrument');
  const tests = searchParams.getAll('test');
  const types = searchParams.getAll('typeofprod');
  const page = parseInt(searchParams.get('page') || '1');
  const isExportAll = searchParams.get('all') === 'true';

  const limit = 50;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];

  // Bộ lọc theo instrument
  if (instruments.length > 0) {
    const ilikeConditions = instruments
      .map((i) => `"InstrumentName" ILIKE '%${i}%'`)
      .join(' OR ');
    conditions.push(`(${ilikeConditions})`);
  }

  // Bộ lọc theo test
  if (tests.length > 0) {
    const quoted = tests.map((t) => `'${t}'`).join(', ');
    if (instruments.length > 0) {
      // Nếu có cả instrument và test → test IN list hoặc rỗng
      conditions.push(`("Parametershort" IN (${quoted}) OR "Parametershort" = '')`);
    } else {
      conditions.push(`"Parametershort" IN (${quoted})`);
    }
  }

  // Bộ lọc theo type
  if (types.length > 0) {
    const quoted = types.map((t) => `'${t}'`).join(', ');
    conditions.push(`"UsageType" IN (${quoted})`);
  }

  // WHERE clause
  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Raw SQL truy vấn dữ liệu
  const baseSelect = `
  SELECT
    "PL6",
    "MaterialNumber",
    "Material_Name",
    "UsageType" AS "Nhóm sản phẩm",
    STRING_AGG(DISTINCT "InstrumentName", ', ') AS "InstrumentName",
    "Parametershort" AS "Nhóm xét nghiệm"
  FROM "raw_data"
  ${whereSQL}
  GROUP BY "PL6", "MaterialNumber", "Material_Name", "UsageType", "Parametershort"
  ORDER BY
    "Parametershort",  -- xếp alphabet
    CASE "UsageType"
      WHEN 'Hóa chất' THEN 0
      WHEN 'Chất chuẩn (QC)' THEN 1
      WHEN 'Chất hiệu chuẩn (Cal)' THEN 2
      WHEN 'Phụ trợ' THEN 3
      ELSE 99
    END,
    "PL6"
  `; // ❌ KHÔNG dấu ; ở cuối

  const dataQuery = isExportAll
    ? baseSelect
    : `${baseSelect} LIMIT ${limit} OFFSET ${offset};`;

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
