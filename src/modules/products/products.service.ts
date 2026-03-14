import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const { categoryId, name, slug, ...data } = createProductDto;

    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const productSlug = slug || this.generateSlug(name);

    try {
      return await this.prisma.product.create({
        data: {
          ...data,
          name,
          slug: productSlug,
          category: { connect: { id: categoryId } },
          images: (data.images as unknown as Prisma.InputJsonValue) || [],
          tags: (data.tags as unknown as Prisma.InputJsonValue) || [],
          dimensions: data.dimensions as unknown as Prisma.InputJsonValue,
          seo: data.seo as unknown as Prisma.InputJsonValue,
        } as Prisma.ProductCreateInput,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Product slug or SKU already exists');
      }
      throw error;
    }
  }

  async findAll(query: FindProductsQueryDto) {
    const { page = 1, limit = 10, search, categoryId, isFeatured, minPrice, maxPrice, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: isActive !== undefined ? isActive : true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    if (updateProductDto.name && !updateProductDto.slug) {
      updateProductDto.slug = this.generateSlug(updateProductDto.name);
    }

    try {
      return await this.prisma.product.update({
        where: { id },
        data: updateProductDto as Prisma.ProductUpdateInput,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Product slug or SKU already exists');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.product.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
}
