require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
// 限制连接数为 1
const pool = new Pool({ connectionString, max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkConnection() {
    try {
        console.log('Testing database connection...');
        // 执行一个简单的查询
        const count = await prisma.product.count();
        console.log('Database connected! Product count:', count);

        // 同时也尝试读取 Banner 配置
        const config = await prisma.siteConfig.findUnique({
            where: {
                key: 'banner_slides',
            },
        });
        console.log('Current banner_slides config:', config);

    } catch (error) {
        console.error('Connection failed:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

checkConnection();
