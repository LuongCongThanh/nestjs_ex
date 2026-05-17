import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { canTransition } from './order-transitions.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

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
      const address = await tx.address.findUnique({ where: { id: dto.addressId } });
      if (!address) throw new NotFoundException('Address not found');
      if (address.userId !== userId) throw new ForbiddenException('Address does not belong to you');

      const snapshot: Prisma.JsonObject = {
        fullName: address.fullName,
        phone: address.phone,
        address: address.address,
        ward: address.ward ?? null,
        district: address.district ?? null,
        city: address.city,
        country: address.country,
        postalCode: address.postalCode ?? null,
      };

      const productIds = cart.items.map((item) => item.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of cart.items) {
        const product = productMap.get(item.productId)!;
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for: ${product.name} (requested ${item.quantity}, available ${product.stock})`,
          );
        }
      }

      const orderNumber = `ORD-${Date.now()}-${nanoid(6)}`;

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          total,
          shippingAddressSnapshot: snapshot,
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

      await Promise.all(
        cart.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          }),
        ),
      );

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    return order;
  }

  async findAll(userId: string, role: UserRole, query: PaginationDto) {
    const where = role === UserRole.user ? { userId } : {};
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: query.skip,
        take: query.take,
        include: { orderItems: { include: { product: { select: { id: true, name: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      total,
    };
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
