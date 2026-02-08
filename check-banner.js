require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
// 限制连接数为 1
const pool = new Pool({ connectionString, max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkBannerConfig() {
    try {
        const config = await prisma.siteConfig.findUnique({
            where: {
                key: 'banner_slides',
            },
        });
        console.log('Current banner_slides config:', config);
    } catch (error) {
        console.error('Error fetching banner config:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

checkBannerConfig();
