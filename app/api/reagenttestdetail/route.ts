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

  // --- Bộ lọc instrument ---
  if (instruments.length > 0) {
    const ilikeConditions = instruments
      .map((i) => `rd."InstrumentName" ILIKE '%${i}%'`)
      .join(' OR ');
    conditions.push(`(${ilikeConditions})`);
  }

  // --- Bộ lọc test ---
  if (tests.length > 0) {
    const quoted = tests.map((t) => `'${t}'`).join(', ');
    conditions.push(`
      (
        rd."Parametershort" IN (${quoted}) 
        or nx."Parametershort" IN (${quoted})
      )
    `);
  }

  // --- Bộ lọc type ---
  if (types.length > 0) {
    const quoted = types.map((t) => `'${t}'`).join(', ');
    conditions.push(`rd."UsageType" IN (${quoted})`);
  }

  // --- WHERE clause động ---
  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // --- SQL chính ---
  const baseSelect = `
    WITH nhom_xet_nghiem AS (
        SELECT DISTINCT "Parametershort", "InstrumentName"
        FROM "raw_data"
        WHERE "Parametershort" IS NOT NULL
          AND TRIM("Parametershort") <> ''
    )
    SELECT
        rd."PL6",
        rd."MaterialNumber",
        rd."Material_Name",
        rd."UsageType" AS "Nhóm sản phẩm",
        rd."InstrumentName",
        COALESCE(
            NULLIF(TRIM(rd."Parametershort"), ''),
            nx."Parametershort"
        ) AS "Nhóm xét nghiệm",
        rd."Dự án",
        rd."Dự kiến"
    FROM "raw_data" rd
    LEFT JOIN nhom_xet_nghiem nx
        ON (rd."Parametershort" IS NULL OR TRIM(rd."Parametershort") = '')
        AND nx."InstrumentName" = rd."InstrumentName"
    ${whereSQL}
    ORDER BY
        rd."InstrumentName",
        "Nhóm xét nghiệm",
        CASE rd."UsageType"
            WHEN 'Hóa chất' THEN 0
            WHEN 'Chất chuẩn (QC)' THEN 1
            WHEN 'Chất hiệu chuẩn (Cal)' THEN 2
            WHEN 'Phụ trợ' THEN 3
            ELSE 99
        END,
        rd."PL6"
  `;

  const dataQuery = isExportAll
    ? baseSelect
    : `${baseSelect} LIMIT ${limit} OFFSET ${offset}`;

  const countQuery = `
    SELECT COUNT(*) FROM (
      ${baseSelect}
    ) AS subquery
  `;

  // --- Thực thi ---
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
