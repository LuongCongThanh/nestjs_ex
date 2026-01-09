import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number) {
    // 1. Get cart items
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. Calculate total
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (Number(item.product.price) * item.quantity);
    }, 0);

    // 3. Transaction: Create Order, OrderItems, clear Cart
    return this.prisma.$transaction(async (prisma) => {
      // Create Order
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount,
          status: 'PENDING',
        },
      });

      // Create OrderItems
      for (const item of cartItems) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          },
        });
      }

      // Clear Cart
      await prisma.cartItem.deleteMany({
        where: { userId },
      });

      return order;
    });
  }

  async findAll(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
