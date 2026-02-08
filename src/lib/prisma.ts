import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
// @ts-ignore - pg types issue on Vercel
import { Pool } from 'pg';
import 'dotenv/config';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient;
};

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        // 在构建阶段或未配置环境变量时，提供更友好的错误提示
        // 改为 console.error 而不是直接 throw，防止构建脚本（如 lint）在没有 env 时崩溃
        console.warn('⚠️  DATABASE_URL environment variable is missing. Database connection will fail.');
        // 移除 throw Error，因为 Vercel Build 时可能也没有该变量，但需要 Build 成功
        // if (process.env.NODE_ENV === 'production') { ... }
    }

    // 限制连接池大小，避免 Supabase 连接数耗尽
    const pool = new Pool({
        connectionString: connectionString || '', // Prevent crash if undefined
        max: process.env.NODE_ENV === 'development' ? 2 : 10,
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
