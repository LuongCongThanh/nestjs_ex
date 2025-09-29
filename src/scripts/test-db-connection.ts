import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function testDatabaseConnection() {
  console.log('🔍 Đang kiểm tra kết nối database với Prisma...');

  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    // Test kết nối cơ bản
    await prisma.$connect();
    console.log('✅ Kết nối database thành công!');

    // Test query đơn giản
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test thành công:', result);

    // Test tạo bảng users nếu chưa có (PostgreSQL syntax)
    try {
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        "fullName" VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(255),
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`;
      console.log('✅ Bảng users đã được tạo/kiểm tra thành công');
    } catch (tableError) {
      console.log(
        'ℹ️ Bảng users có thể đã tồn tại hoặc có lỗi:',
        tableError.message,
      );
    }

    await prisma.$disconnect();
    await app.close();
    console.log('🎉 Test kết nối hoàn tất thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi kết nối database:', error.message);
    console.error('📝 Chi tiết lỗi:', error);
    process.exit(1);
  }
}

testDatabaseConnection();
