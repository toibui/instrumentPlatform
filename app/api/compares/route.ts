import { NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { sql } from 'drizzle-orm'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const types = searchParams.getAll('Indication')
  const categories = searchParams.getAll('Category')

  const conditions = []

  if (categories.length > 0) {
    conditions.push(
      sql`"Category" IN (${sql.join(
        categories.map((c) => sql`${c}`),
        sql`, `
      )})`
    )
  }

  if (types.length > 0) {
    conditions.push(
      sql`"Indication area" IN (${sql.join(
        types.map((t) => sql`${t}`),
        sql`, `
      )})`
    )
  }

  const whereClause =
    conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``

  const query = sql`
    SELECT *
    FROM "ccia"
    ${whereClause}
  `

  const result = await db.execute(query)

  const rows = Array.isArray(result)
    ? result
    : (result as any).rows ?? []

  return NextResponse.json({ data: rows })
}