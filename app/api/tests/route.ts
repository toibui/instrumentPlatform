import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instruments = searchParams.getAll('instrument');

  const conditions: string[] = ['"Parametershort" IS NOT NULL'];

  if (instruments.length > 0) {
    const quoted = instruments.map((i) => `'${i}'`).join(', ');
    conditions.push(`"InstrumentName" IN (${quoted})`);
  }

  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT DISTINCT "Parametershort"
    FROM "raw_data"
    ${whereSQL}
    ORDER BY "Parametershort" ASC;
  `;

  const result = await db.execute(sql.raw(query));

  const names = result.map((r: any) => r.Parametershort).filter((n: any) => typeof n === 'string');

  return NextResponse.json(names);
}
