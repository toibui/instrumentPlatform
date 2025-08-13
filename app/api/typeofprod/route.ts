import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

// Định nghĩa kiểu dữ liệu cho row, kế thừa Record<string, unknown> để thỏa constraint của Drizzle
interface UsageTypeRow extends Record<string, unknown> {
  UsageType: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const usagetypes = searchParams.getAll('instrument');

  const conditions: string[] = ['"UsageType" IS NOT NULL'];

  if (usagetypes.length > 0) {
    const quoted = usagetypes.map((i) => `'${i}'`).join(', ');
    conditions.push(`"UsageType" IN (${quoted})`);
  }

  const whereSQL =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT DISTINCT "UsageType"
    FROM "raw_data"
    ${whereSQL}
    ORDER BY "UsageType" ASC;
  `;

  // Khai báo kiểu dữ liệu trả về
  const execResult = await db.execute<UsageTypeRow>(sql.raw(query));

  // Chuẩn hoá kết quả về array đúng kiểu
  const rows: UsageTypeRow[] = Array.isArray(execResult)
    ? execResult
    : Array.isArray((execResult as { rows: UsageTypeRow[] })?.rows)
    ? (execResult as { rows: UsageTypeRow[] }).rows
    : [];

  // Lấy đúng cột UsageType và lọc string hợp lệ
  const names = rows
    .map((r) => r.UsageType)
    .filter((n): n is string => typeof n === 'string' && n.trim() !== '');

  return NextResponse.json(names);
}
