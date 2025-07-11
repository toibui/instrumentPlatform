import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const query = `
    SELECT DISTINCT "InstrumentName", "Parametershort"
    FROM "raw_data"
    WHERE "InstrumentName" IS NOT NULL AND "Parametershort" IS NOT NULL
    ORDER BY "InstrumentName", "Parametershort";
  `;

  const result = await db.execute(sql.raw(query));

  const relations = result
    .filter((r: any) => typeof r.InstrumentName === 'string' && typeof r.Parametershort === 'string')
    .map((r: any) => ({
      instrument: r.InstrumentName,
      test: r.Parametershort,
    }));

  return NextResponse.json(relations);
}
