import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const types = searchParams.getAll('project');
  const page = parseInt(searchParams.get('page') || '1');
  const isExportAll = searchParams.get('all') === 'true';

  const limit = 50;
  const offset = (page - 1) * limit;

  // Điều kiện WHERE
  const conditions = [];

  if (types.length > 0) {
    conditions.push(
      sql`"Project" IN (${sql.join(types.map((t) => sql`${t}`), sql`, `)})`
    );
  }

  const whereClause =
    conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

  // Query chính
  const dataQuery = isExportAll
    ? sql`
        SELECT *
        FROM "transformed_data"
        ${whereClause}
      `
    : sql`
        SELECT *
        FROM "transformed_data"
        ${whereClause}
        LIMIT ${limit}
        OFFSET ${offset}
      `;

  const dataResult = await db.execute(dataQuery);

  let total = 0;

  if (!isExportAll) {
    const countQuery = sql`
      SELECT COUNT(*) as count
      FROM "transformed_data"
      ${whereClause}
    `;

    const countResult = await db.execute(countQuery);

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
