import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { canTransition } from '../order/order-transitions.util';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(userId: string, dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException();
    if (order.paymentStatus !== PaymentStatus.pending) {
      throw new BadRequestException('Order already has a payment');
    }

    return this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        amount: order.total,
        paymentMethod: dto.paymentMethod,
        transactionId: dto.transactionId,
      },
    });
  }

  async confirmPayment(paymentId: number, role: UserRole) {
    if (role !== UserRole.staff && role !== UserRole.admin) {
      throw new ForbiddenException();
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === PaymentStatus.paid) {
      throw new BadRequestException('Payment already confirmed');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.paid },
      });

      if (canTransition(payment.order.status, OrderStatus.confirmed, 'system')) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.confirmed, paymentStatus: PaymentStatus.paid },
        });
      }

      return updatedPayment;
    });
  }

  async findByOrder(orderId: number, userId: string, role: UserRole) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (role === UserRole.user && order.userId !== userId) throw new ForbiddenException();

    return this.prisma.payment.findMany({ where: { orderId } });
  }
}
