import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
// @ts-ignore - pg types issue on Vercel
import { Pool } from 'pg';
import 'dotenv/config';

const globalForPrisma = globalThis as unknown as {
    prismaClientInstance: PrismaClient;
    pool: Pool;
};

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL!;
    // 限制连接池大小，避免 Supabase 连接数耗尽
    const pool = new Pool({
        connectionString,
        max: process.env.NODE_ENV === 'development' ? 2 : 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prismaClientInstance || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prismaClientInstance = prisma;
}

export default prisma;
