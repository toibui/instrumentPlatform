// app/api/raw-data/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { rawData } from '../../../lib/schema';
import { and, inArray, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instruments = searchParams.getAll('instrument');
  const test = searchParams.get('test') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (instruments.length > 0) {
    conditions.push(inArray(rawData.InstrumentName, instruments));
  }

  if (test) {
    conditions.push(sql`${rawData.Test} ~* ${test}`);
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select()
    .from(rawData)
    .where(whereClause)
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(rawData)
    .where(whereClause);

  const total = Number(totalResult[0]?.count || 0);

  return NextResponse.json({ data, total });
}
