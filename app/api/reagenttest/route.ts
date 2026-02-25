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

  // ===== Instrument filter =====
  if (instruments.length > 0) {
    const instrumentConditions = instruments.map((i) =>
      sql`"InstrumentName" ILIKE ${'%' + i + '%'}`
    );

    conditions.push(sql`(${sql.join(instrumentConditions, sql` OR `)})`);
  }

  // ===== Test filter =====
  if (tests.length > 0) {
    const testList = sql.join(
      tests.map((t) => sql`${t}`),
      sql`,`
    );

    if (instruments.length > 0) {
      conditions.push(
        sql`("Parametershort" IN (${testList}) OR "Parametershort" = '')`
      );
    } else {
      conditions.push(sql`"Parametershort" IN (${testList})`);
    }
  }

  // ===== UsageType filter =====
  if (types.length > 0) {
    const typeList = sql.join(
      types.map((t) => sql`${t}`),
      sql`,`
    );
    conditions.push(sql`"UsageType" IN (${typeList})`);
  }

  const whereClause =
    conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

  const baseQuery = sql`
    SELECT
      "PL6",
      "MaterialNumber",
      "Material_Name",
      "UsageType" AS "Nhóm sản phẩm",
      STRING_AGG(DISTINCT "InstrumentName", ', ') AS "InstrumentName",
      STRING_AGG(
        DISTINCT NULLIF(TRIM("Parametershort"), ''),
        ', '
      ) AS "Parametershort",
      "Dự án",
      "Dự kiến"
    FROM "raw_data"
    ${whereClause}
    GROUP BY
      "PL6",
      "MaterialNumber",
      "Material_Name",
      "UsageType",
      "Dự án",
      "Dự kiến"
    ORDER BY
      CASE "UsageType"
        WHEN 'Hóa chất' THEN 0
        WHEN 'Chất chuẩn (QC)' THEN 1
        WHEN 'Chất hiệu chuẩn (Cal)' THEN 2
        WHEN 'Phụ trợ' THEN 3
        ELSE 99
      END,
      "PL6"
  `;

  // ===== DATA QUERY =====
  const dataQuery = isExportAll
    ? baseQuery
    : sql`${baseQuery} LIMIT ${limit} OFFSET ${offset}`;

  const dataResult = await db.execute(dataQuery);

  // ===== COUNT (chỉ khi không export) =====
  let total = 0;

  if (!isExportAll) {
    const countQuery = sql`
      SELECT COUNT(*) FROM (
        ${baseQuery}
      ) AS subquery
    `;

    const countResult = await db.execute(countQuery);
    total = Number((countResult[0] as any).count);
  }

  return NextResponse.json({
    data: dataResult,
    ...(isExportAll ? {} : { total }),
  });
}