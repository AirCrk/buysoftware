// @ts-nocheck
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const pinyin = require('pinyin');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find products where slug is null OR empty
  const products = await prisma.product.findMany({
    where: { OR: [{ slug: null }, { slug: '' }] }
  });
  console.log(`Found ${products.length} products needing slug generation.`);

  for (const product of products) {
    let baseSlug = product.name.trim().toLowerCase();

    // Convert Chinese to Pinyin
    // pinyin("中文", { style: pinyin.STYLE_NORMAL }) returns [['zhong'], ['wen']]
    try {
      const py = pinyin(baseSlug, {
        style: pinyin.STYLE_NORMAL, // Normal style (no tone)
      });
      // Flatten array and join with hyphen
      baseSlug = py.flat().join('-');
    } catch (e) {
      console.warn(`Pinyin conversion failed for ${product.name}, using original name.`);
    }

    // Clean up slug: replace non-alphanumeric with hyphen, remove leading/trailing hyphens
    baseSlug = baseSlug.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (!baseSlug) baseSlug = `product-${product.id.slice(-6)}`; // Fallback

    let newSlug = baseSlug;
    let counter = 1;

    // Ensure uniqueness
    while (await prisma.product.findUnique({ where: { slug: newSlug } })) {
      newSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    console.log(`Updating "${product.name}" -> slug: "${newSlug}"`);
    await prisma.product.update({
      where: { id: product.id },
      data: { slug: newSlug },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
