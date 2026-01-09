import { Injectable, NotFoundException } from '@nestjs/common';
import { AddToCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    const { productId, quantity } = addToCartDto;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if item already in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Create new item
      return this.prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
        },
      });
    }
  }

  async findAll(userId: number) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
  }

  /*
  findOne(id: number) {
    return `This action returns a #${id} cart`;
  }
  */

  async update(id: number, updateCartDto: UpdateCartDto, userId: number) {
    // Ensure item belongs to user
    const item = await this.prisma.cartItem.findMany({
      where: { id, userId },
    });

    if (!item.length) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.update({
      where: { id },
      data: updateCartDto,
    });
  }

  async remove(id: number, userId: number) {
     // Ensure item belongs to user
    const item = await this.prisma.cartItem.findMany({
      where: { id, userId },
    });

    if (!item.length) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({
      where: { id },
    });
  }
}
