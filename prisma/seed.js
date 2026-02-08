require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('开始初始化数据...');

    // 创建平台
    const platforms = ['Windows', 'Mac', 'iOS', 'Android'];
    for (const name of platforms) {
        await prisma.platform.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    console.log('✓ 平台数据已创建');

    // 创建管理员账户
    const hashedPassword = await bcrypt.hash('HON123wellx', 10);
    await prisma.adminUser.upsert({
        where: { email: 'aircrk@gmai.com' },
        update: {},
        create: {
            email: 'aircrk@gmai.com',
            password: hashedPassword,
            name: 'Admin',
        },
    });
    console.log('✓ 管理员账户已创建');
    console.log('  邮箱: aircrk@gmai.com');
    console.log('  密码: HON123wellx');

    // 创建渠道
    const channels = [
        { name: '金州软件', color: '#3B82F6' },
        { name: '未来教育', color: '#10B981' },
        { name: '荔枝软件', color: '#EF4444' },
    ];
    for (const channel of channels) {
        await prisma.channel.upsert({
            where: { name: channel.name },
            update: { color: channel.color },
            create: channel,
        });
    }
    console.log('✓ 渠道数据已创建');

    // 获取平台ID
    const allPlatforms = await prisma.platform.findMany();
    const platformMap = {};
    allPlatforms.forEach((p) => {
        platformMap[p.name] = p.id;
    });

    // 创建示例商品
    const products = [
        {
            name: 'Microsoft 365',
            subtitle: '全套 Office 应用，云端协作更高效',
            originalPrice: 498,
            salePrice: 398,
            cpsLink: 'https://example.com/microsoft365',
            platforms: ['Windows', 'Mac', 'iOS', 'Android'],
        },
        {
            name: 'Adobe Photoshop',
            subtitle: '专业图像编辑与设计工具',
            originalPrice: 888,
            salePrice: 688,
            cpsLink: 'https://example.com/photoshop',
            platforms: ['Windows', 'Mac'],
        },
        {
            name: 'CleanMyMac X',
            subtitle: 'Mac 系统清理与优化',
            originalPrice: 299,
            salePrice: 199,
            cpsLink: 'https://example.com/cleanmymac',
            platforms: ['Mac'],
        },
        {
            name: '1Password',
            subtitle: '安全密码管理器',
            originalPrice: 199,
            salePrice: 149,
            cpsLink: 'https://example.com/1password',
            platforms: ['Windows', 'Mac', 'iOS', 'Android'],
        },
        {
            name: 'Notion',
            subtitle: '一体化工作空间',
            originalPrice: 96,
            salePrice: 48,
            cpsLink: 'https://example.com/notion',
            platforms: ['Windows', 'Mac', 'iOS', 'Android'],
        },
        {
            name: 'Parallels Desktop',
            subtitle: '在 Mac 上运行 Windows',
            originalPrice: 698,
            salePrice: 548,
            cpsLink: 'https://example.com/parallels',
            platforms: ['Mac'],
        },
    ];

    for (const product of products) {
        const platformConnects = product.platforms.map((name) => ({
            id: platformMap[name],
        }));

        await prisma.product.create({
            data: {
                name: product.name,
                subtitle: product.subtitle,
                originalPrice: product.originalPrice,
                salePrice: product.salePrice,
                cpsLink: product.cpsLink,
                platforms: {
                    connect: platformConnects,
                },
            },
        });
    }

    console.log(`✓ 已创建 ${products.length} 个示例商品`);
    console.log('\n初始化完成!');
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
