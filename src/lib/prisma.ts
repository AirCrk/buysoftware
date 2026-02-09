import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
// @ts-ignore - pg types issue on Vercel
import { Pool } from 'pg';
import 'dotenv/config';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient;
};

function createPrismaClient() {
    console.log('🔄 [Prisma] Creating new PrismaClient instance...');
    let connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        // 在构建阶段或未配置环境变量时，提供更友好的错误提示
        // 改为 console.error 而不是直接 throw，防止构建脚本（如 lint）在没有 env 时崩溃
        console.warn('⚠️  DATABASE_URL environment variable is missing. Database connection will fail.');
        // 移除 throw Error，因为 Vercel Build 时可能也没有该变量，但需要 Build 成功
        // if (process.env.NODE_ENV === 'production') { ... }
    }

    // 限制连接池大小，避免 Supabase 连接数耗尽
    if (process.env.NODE_ENV !== 'production') {
        // 自动将 5432 (Session Mode) 替换为 6543 (Transaction Mode)
        if (connectionString?.includes(':5432')) {
            console.warn('⚠️ 检测到端口 5432，自动切换到 6543 (Transaction Mode) 以解决连接限制问题。');
            // 注意：这里我们修改的是局部变量，用来创建 Pool
            // eslint-disable-next-line no-param-reassign
            // @ts-ignore
            connectionString = connectionString.replace(':5432', ':6543');
        }

        // 脱敏输出连接字符串，方便调试连接模式（Session:5432 vs Transaction:6543）
        const maskedUrl = connectionString?.replace(/:[^:]*@/, ':****@');
        console.log(`[Prisma] Connecting to DB: ${maskedUrl}`);
    }

    const pool = new Pool({
        connectionString: connectionString || '', // Prevent crash if undefined
        max: process.env.NODE_ENV === 'development' ? 1 : 10,
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
