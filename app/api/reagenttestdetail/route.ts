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

  const conditions: any[] = [];

  // --- Filter instruments ---
  if (instruments.length > 0) {
    const instrumentConditions = instruments.map((i) =>
      sql`rd."InstrumentName" ILIKE ${'%' + i + '%'}`
    );
    conditions.push(sql`(${sql.join(instrumentConditions, sql` OR `)})`);
  }

  // --- Filter tests ---
  if (tests.length > 0) {
    const testList = sql.join(tests.map((t) => sql`${t}`), sql`,`);
    conditions.push(sql`
      (
        rd."Parametershort" IN (${testList}) 
        OR nx."Parametershort" IN (${testList})
      )
    `);
  }

  // --- Filter types ---
  if (types.length > 0) {
    const typeList = sql.join(types.map((t) => sql`${t}`), sql`,`);
    conditions.push(sql`rd."UsageType" IN (${typeList})`);
  }

  const whereClause =
    conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

  // --- Base SQL ---
  const baseQuery = sql`
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
      COALESCE(NULLIF(TRIM(rd."Parametershort"), ''), nx."Parametershort") AS "Nhóm xét nghiệm",
      rd."Dự án",
      rd."Dự kiến"
    FROM "raw_data" rd
    LEFT JOIN nhom_xet_nghiem nx
      ON (rd."Parametershort" IS NULL OR TRIM(rd."Parametershort") = '')
      AND nx."InstrumentName" = rd."InstrumentName"
    ${whereClause}
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

  // --- Data query ---
  const dataQuery = isExportAll
    ? baseQuery
    : sql`${baseQuery} LIMIT ${limit} OFFSET ${offset}`;

  const dataResult = await db.execute(dataQuery);

  // --- Count only when not exporting ---
  let total = 0;
  if (!isExportAll) {
    const countQuery = sql`
      SELECT COUNT(*) FROM (
        ${baseQuery}
      ) AS subquery
    `;
    const countResult = await db.execute(countQuery);
    total = Array.isArray(countResult) && countResult.length > 0
      ? Number((countResult[0] as any).count)
      : 0;
  }

  return NextResponse.json({
    data: dataResult,
    ...(isExportAll ? {} : { total }),
  });
}