import * as bcrypt from 'bcryptjs';
import { Category } from 'src/entities/category.entity';
import { Product } from 'src/entities/product.entity';
import { User, UserRole } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import dataSource from '../config/typeorm.config';

async function seed() {
  let connection: DataSource | null = null;

  try {
    // Initialize connection
    connection = await dataSource.initialize();
    console.log('📦 Database connection established');

    // Check if data already exists
    const userCount = await connection.getRepository(User).count();
    if (userCount > 0) {
      console.log('⚠️  Database already seeded. Skipping...');
      return;
    }

    console.log('🌱 Starting database seeding...\n');

    // ===== 1. Create Admin User =====
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const adminUser = connection.getRepository(User).create({
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      phone: '0123456789',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
    });
    await connection.getRepository(User).save(adminUser);
    console.log('✅ Admin user created: admin@example.com / Admin@123\n');

    // ===== 2. Create Test User =====
    console.log('👤 Creating test user...');
    const testUser = connection.getRepository(User).create({
      email: 'user@example.com',
      password: await bcrypt.hash('User@123', 10),
      firstName: 'Test',
      lastName: 'User',
      phone: '0987654321',
      role: UserRole.USER,
      isActive: true,
      emailVerified: true,
    });
    await connection.getRepository(User).save(testUser);
    console.log('✅ Test user created: user@example.com / User@123\n');

    // ===== 3. Create Categories =====
    console.log('📁 Creating categories...');
    const categories = [
      {
        name: 'Điện thoại & Phụ kiện',
        slug: 'dien-thoai-phu-kien',
        description: 'Điện thoại thông minh và phụ kiện',
        isActive: true,
      },
      {
        name: 'Laptop & Máy tính',
        slug: 'laptop-may-tinh',
        description: 'Laptop, máy tính để bàn và linh kiện',
        isActive: true,
      },
      {
        name: 'Thời trang Nam',
        slug: 'thoi-trang-nam',
        description: 'Quần áo, giày dép thời trang nam',
        isActive: true,
      },
      {
        name: 'Thời trang Nữ',
        slug: 'thoi-trang-nu',
        description: 'Quần áo, giày dép thời trang nữ',
        isActive: true,
      },
      {
        name: 'Đồ gia dụng',
        slug: 'do-gia-dung',
        description: 'Đồ dùng gia đình, nhà bếp',
        isActive: true,
      },
      {
        name: 'Sách & Văn phòng phẩm',
        slug: 'sach-van-phong-pham',
        description: 'Sách, vở, dụng cụ văn phòng',
        isActive: true,
      },
    ];

    const savedCategories = await connection.getRepository(Category).save(categories);
    console.log(`✅ Created ${savedCategories.length} categories\n`);

    // ===== 4. Create Sub-categories =====
    console.log('📁 Creating sub-categories...');
    const subCategories = [
      {
        name: 'iPhone',
        slug: 'iphone',
        description: 'Điện thoại iPhone',
        parentId: savedCategories[0].id,
        isActive: true,
      },
      {
        name: 'Samsung',
        slug: 'samsung',
        description: 'Điện thoại Samsung',
        parentId: savedCategories[0].id,
        isActive: true,
      },
      {
        name: 'Tai nghe',
        slug: 'tai-nghe',
        description: 'Tai nghe, headphone',
        parentId: savedCategories[0].id,
        isActive: true,
      },
      {
        name: 'Laptop Gaming',
        slug: 'laptop-gaming',
        description: 'Laptop chơi game',
        parentId: savedCategories[1].id,
        isActive: true,
      },
      {
        name: 'Laptop Văn phòng',
        slug: 'laptop-van-phong',
        description: 'Laptop làm việc',
        parentId: savedCategories[1].id,
        isActive: true,
      },
    ];

    await connection.getRepository(Category).save(subCategories);
    console.log(`✅ Created ${subCategories.length} sub-categories\n`);

    // ===== 5. Create Sample Products =====
    console.log('🛍️  Creating sample products...');
    const products = [
      {
        name: 'iPhone 15 Pro Max 256GB',
        slug: 'iphone-15-pro-max-256gb',
        description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình Dynamic Island',
        price: 29990000,
        comparePrice: 34990000,
        stock: 50,
        sku: 'IP15PM256',
        images: ['/products/iphone-15-pro-max-1.jpg', '/products/iphone-15-pro-max-2.jpg'],
        categoryId: savedCategories[0].id,
        weight: 0.221,
        dimensions: { length: 16.01, width: 7.7, height: 0.83 },
        tags: ['iphone', 'flagship', 'apple', '5g'],
        seo: {
          metaTitle: 'iPhone 15 Pro Max 256GB - Giá tốt nhất',
          metaDescription: 'Mua iPhone 15 Pro Max 256GB chính hãng, giá tốt, bảo hành 12 tháng',
          keywords: 'iphone 15 pro max, iphone, apple, điện thoại',
        },
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'Samsung Galaxy S24 Ultra 512GB',
        slug: 'samsung-galaxy-s24-ultra-512gb',
        description: 'Galaxy S24 Ultra với bút S Pen, camera 200MP, chip Snapdragon 8 Gen 3',
        price: 27990000,
        comparePrice: 31990000,
        stock: 35,
        sku: 'SSS24U512',
        images: ['/products/galaxy-s24-ultra-1.jpg', '/products/galaxy-s24-ultra-2.jpg'],
        categoryId: savedCategories[0].id,
        weight: 0.232,
        dimensions: { length: 16.22, width: 7.9, height: 0.86 },
        tags: ['samsung', 'galaxy', 'flagship', '5g'],
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'Laptop Dell XPS 13 9340',
        slug: 'laptop-dell-xps-13-9340',
        description: 'Dell XPS 13 với Intel Core Ultra 7, RAM 16GB, SSD 512GB, màn hình 13.4" OLED',
        price: 35990000,
        comparePrice: 39990000,
        stock: 20,
        sku: 'DXPS139340',
        images: ['/products/dell-xps-13-1.jpg', '/products/dell-xps-13-2.jpg'],
        categoryId: savedCategories[1].id,
        weight: 1.19,
        dimensions: { length: 29.5, width: 19.9, height: 1.55 },
        tags: ['laptop', 'dell', 'ultrabook', 'premium'],
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'MacBook Air M3 15 inch 2024',
        slug: 'macbook-air-m3-15-inch-2024',
        description: 'MacBook Air 15" với chip Apple M3, RAM 8GB, SSD 256GB, màu Midnight',
        price: 32990000,
        comparePrice: 36990000,
        stock: 25,
        sku: 'MBA15M3',
        images: ['/products/macbook-air-m3-1.jpg', '/products/macbook-air-m3-2.jpg'],
        categoryId: savedCategories[1].id,
        weight: 1.51,
        dimensions: { length: 34.04, width: 23.76, height: 1.15 },
        tags: ['macbook', 'apple', 'laptop', 'm3'],
        isActive: true,
        isFeatured: true,
      },
      {
        name: 'Sony WH-1000XM5 Wireless',
        slug: 'sony-wh-1000xm5-wireless',
        description: 'Tai nghe Sony WH-1000XM5 chống ồn chủ động, âm thanh Hi-Res, pin 30 giờ',
        price: 7990000,
        comparePrice: 9990000,
        stock: 100,
        sku: 'SWXM5',
        images: ['/products/sony-wh-1000xm5-1.jpg'],
        categoryId: savedCategories[0].id,
        weight: 0.25,
        dimensions: { length: 25.4, width: 20.3, height: 9.0 },
        tags: ['tai nghe', 'sony', 'wireless', 'noise cancelling'],
        isActive: true,
        isFeatured: false,
      },
      {
        name: 'Áo thun nam basic cotton',
        slug: 'ao-thun-nam-basic-cotton',
        description: 'Áo thun nam 100% cotton, form regular fit, nhiều màu',
        price: 199000,
        comparePrice: 299000,
        stock: 200,
        sku: 'ATNBC01',
        images: ['/products/ao-thun-nam-1.jpg'],
        categoryId: savedCategories[2].id,
        weight: 0.2,
        tags: ['áo thun', 'nam', 'cotton', 'basic'],
        isActive: true,
        isFeatured: false,
      },
    ];

    const savedProducts = await connection.getRepository(Product).save(products);
    console.log(`✅ Created ${savedProducts.length} sample products\n`);

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - Users: 2 (1 admin, 1 test user)`);
    console.log(`   - Categories: ${savedCategories.length}`);
    console.log(`   - Sub-categories: ${subCategories.length}`);
    console.log(`   - Products: ${savedProducts.length}\n`);
    console.log('🔑 Login credentials:');
    console.log('   Admin: admin@example.com / Admin@123');
    console.log('   User:  user@example.com / User@123\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    if (connection && connection.isInitialized) {
      await connection.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run seeder
seed()
  .then(() => {
    console.log('✅ Seeding process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
