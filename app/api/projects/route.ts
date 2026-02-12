import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projects = searchParams.getAll('project');

  const conditions: string[] = ['"Project" IS NOT NULL'];

  if (projects.length > 0) {
    const quoted = projects.map((i) => `'${i}'`).join(', ');
    conditions.push(`"Project" IN (${quoted})`);
  }

  const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT DISTINCT "Project"
    FROM "transformed_data"
    ${whereSQL}
    ORDER BY "Project" ASC;
  `;

  const result = await db.execute(sql.raw(query));

  const names = result
  .map((r: Record<string, unknown>) => r.Project)
  .filter((n): n is string => typeof n === 'string');

  return NextResponse.json(names);
}
