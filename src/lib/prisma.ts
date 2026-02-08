import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
// @ts-ignore - pg types issue on Vercel
import { Pool } from 'pg';
import 'dotenv/config';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient;
    pool: Pool;
};

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL!;
    // 限制连接池大小，避免 Supabase 连接数耗尽
    const pool = new Pool({
        connectionString,
        max: process.env.NODE_ENV === 'development' ? 5 : 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
