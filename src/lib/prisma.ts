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
    if (process.env.NODE_ENV !== 'production') {
        // 检查是否仍在使用 5432 (Session Mode)
        if (connectionString?.includes(':5432')) {
            const errorMsg = `
================================================================================
🚨 错误：检测到旧的数据库连接配置 (端口 5432)！
   您必须【重启开发服务器】(Ctrl+C 然后 npm run dev) 以应用新的 .env 配置。
   新的配置应使用端口 6543 (Transaction Mode) 来解决连接数限制问题。
================================================================================
            `;
            console.warn(errorMsg);
            // throw new Error('请重启开发服务器以应用 .env 更新！');
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
