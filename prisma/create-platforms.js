require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Running script to create platforms...');

    const platforms = [
        { name: 'Windows', icon: 'windows' },
        { name: 'Mac', icon: 'apple' },
        { name: 'iOS', icon: 'apple' },
        { name: 'Android', icon: 'android' },
    ];
    for (const p of platforms) {
        console.log(`Creating/Updating platform: ${p.name}`);
        const platform = await prisma.platform.upsert({
            where: { name: p.name },
            update: { icon: p.icon },
            create: { name: p.name, icon: p.icon },
        });
        console.log(`✓ Platform synced: ${platform.name} (ID: ${platform.id})`);
    }

    console.log('\nAll platforms synced successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
