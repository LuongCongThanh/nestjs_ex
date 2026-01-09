import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create Categories
  const electronics = await prisma.category.create({
    data: { name: 'Electronics' },
  });

  const clothing = await prisma.category.create({
    data: { name: 'Clothing' },
  });

  // Create Products
  await prisma.product.create({
    data: {
      name: 'Smartphone',
      description: 'Latest model smartphone',
      price: 999.99,
      categoryId: electronics.id,
    },
  });

  await prisma.product.create({
    data: {
      name: 'Laptop',
      description: 'High performance laptop',
      price: 1499.99,
      categoryId: electronics.id,
    },
  });

  await prisma.product.create({
    data: {
      name: 'T-Shirt',
      description: 'Cotton T-Shirt',
      price: 19.99,
      categoryId: clothing.id,
    },
  });

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
