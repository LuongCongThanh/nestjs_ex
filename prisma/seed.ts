import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Tạo test users
  const hashedPassword = await hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      phone: '+1234567890',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword,
      phone: '+0987654321',
    },
  });

  // Tạo sample todos
  await prisma.todo.createMany({
    data: [
      {
        title: 'Buy groceries',
        description: 'Milk, bread, eggs, and fruits',
        completed: false,
        userId: user1.id,
      },
      {
        title: 'Complete project',
        description: 'Finish the NestJS todo application',
        completed: true,
        userId: user1.id,
      },
      {
        title: 'Exercise',
        description: 'Go to the gym for 1 hour',
        completed: false,
        userId: user2.id,
      },
      {
        title: 'Read book',
        description: 'Read "Clean Code" chapter 3',
        completed: false,
        userId: user2.id,
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log(`👤 Created users: John Doe (${user1.id}), Jane Smith (${user2.id})`);
  console.log('📝 Created 4 sample todos');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });