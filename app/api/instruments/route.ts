// app/api/raw-data/instruments/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { rawData } from '../../../lib/schema';
import { isNotNull } from 'drizzle-orm';

export async function GET() {
  const result = await db
    .selectDistinct({ name: rawData.InstrumentName })
    .from(rawData)
    .where(isNotNull(rawData.InstrumentName)); // bỏ null

  const names = result.map((r) => r.name).filter((n): n is string => typeof n === 'string');

  return NextResponse.json(names);
}
