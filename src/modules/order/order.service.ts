import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { canTransition } from './order-transitions.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    const total = subtotal;

    const order = await this.prisma.$transaction(async (tx) => {
      const orderNumber = `ORD-${Date.now()}`;

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          total,
          shippingAddressSnapshot: dto.shippingAddress as Prisma.JsonObject,
          notes: dto.notes,
          orderItems: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { orderItems: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    return order;
  }

  async findAll(userId: string, role: UserRole) {
    const where = role === UserRole.user ? { userId } : {};
    return this.prisma.order.findMany({
      where,
      include: { orderItems: { include: { product: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: string, role: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { orderItems: { include: { product: { select: { id: true, name: true, images: true } } } } },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (role === UserRole.user && order.userId !== userId) throw new ForbiddenException();

    return order;
  }

  async updateStatus(id: number, userId: string, role: UserRole, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    if (role === UserRole.user && order.userId !== userId) throw new ForbiddenException();

    if (!canTransition(order.status, dto.status, role)) {
      throw new BadRequestException(`Cannot transition order from ${order.status} to ${dto.status}`);
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        cancelReason: dto.cancelReason ?? undefined,
      },
    });
  }
}
