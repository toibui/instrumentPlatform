import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// ⚠️ Cần biến môi trường DATABASE_URL trong .env
const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client);
