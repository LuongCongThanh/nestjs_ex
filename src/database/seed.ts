import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('📦 Database connection established');

    // Check if data already exists
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('⚠️  Database already seeded. Skipping...');
      return;
    }

    console.log('🌱 Starting database seeding...\n');

    // ===== 1. Create Admin User =====
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'System',
        phone: '0123456789',
        role: UserRole.admin,
        isActive: true,
        emailVerified: true,
      },
    });
    console.log('✅ Admin user created: admin@example.com / Admin@123\n');

    // ===== 2. Create Test User =====
    console.log('👤 Creating test user...');
    await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: await bcrypt.hash('User@123', 12),
        firstName: 'Test',
        lastName: 'User',
        phone: '0987654321',
        role: UserRole.user,
        isActive: true,
        emailVerified: true,
      },
    });
    console.log('✅ Test user created: user@example.com / User@123\n');

    // ===== 3. Create Categories =====
    console.log('📁 Creating categories...');
    const categories = [
      { name: 'Điện thoại & Phụ kiện', slug: 'dien-thoai-phu-kien', description: 'Điện thoại thông minh và phụ kiện' },
      { name: 'Laptop & Máy tính', slug: 'laptop-may-tinh', description: 'Laptop, máy tính để bàn và linh kiện' },
      { name: 'Thời trang Nam', slug: 'thoi-trang-nam', description: 'Quần áo, giày dép thời trang nam' },
      { name: 'Thời trang Nữ', slug: 'thoi-trang-nu', description: 'Quần áo, giày dép thời trang nữ' },
      { name: 'Đồ gia dụng', slug: 'do-gia-dung', description: 'Đồ dùng gia đình, nhà bếp' },
      { name: 'Sách & Văn phòng phẩm', slug: 'sach-van-phong-pham', description: 'Sách, vở, dụng cụ văn phòng' },
    ];

    for (const cat of categories) {
      await prisma.category.create({ data: cat });
    }
    const savedCategories = await prisma.category.findMany();
    console.log(`✅ Created ${savedCategories.length} categories\n`);

    // ===== 4. Create Sample Products =====
    console.log('🛍️  Creating sample products...');
    const products = [
      {
        name: 'iPhone 15 Pro Max 256GB',
        slug: 'iphone-15-pro-max-256gb',
        description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình Dynamic Island',
        price: 29990000,
        stock: 50,
        sku: 'IP15PM256',
        categoryId: savedCategories[0].id,
        tags: ['iphone', 'flagship', 'apple', '5g'],
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'Samsung Galaxy S24 Ultra 512GB',
        slug: 'samsung-galaxy-s24-ultra-512gb',
        description: 'Galaxy S24 Ultra với bút S Pen, camera 200MP, chip Snapdragon 8 Gen 3',
        price: 27990000,
        stock: 35,
        sku: 'SSS24U512',
        categoryId: savedCategories[0].id,
        tags: ['samsung', 'galaxy', 'flagship', '5g'],
        isActive: true,
        isFeatured: true,
      },
    ];

    for (const prod of products) {
      await prisma.product.create({ data: prod as any });
    }

    console.log('🎉 Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

seed();
