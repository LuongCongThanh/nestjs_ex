import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { generateSlug } from '@common/utils/slug.util';
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

    const productSlug = slug || generateSlug(name);

    try {
      return await this.prisma.product.create({
        data: {
          ...data,
          name,
          slug: productSlug,
          category: { connect: { id: categoryId } },
          dimensions: data.dimensions ? (data.dimensions as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          seo: data.seo ? (data.seo as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
        select: this.getProductSelect(),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
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
        select: this.getProductSelect(),
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
      select: this.getProductSelect(),
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    if (updateProductDto.name && !updateProductDto.slug) {
      updateProductDto.slug = generateSlug(updateProductDto.name);
    }

    try {
      const { categoryId, dimensions, seo, ...restData } = updateProductDto;

      const updateData: Prisma.ProductUpdateInput = {
        ...restData,
      };

      if (categoryId) {
        updateData.category = { connect: { id: categoryId } };
      }

      if (dimensions) {
        updateData.dimensions = dimensions as unknown as Prisma.InputJsonValue;
      }

      if (seo) {
        updateData.seo = seo as unknown as Prisma.InputJsonValue;
      }

      return await this.prisma.product.update({
        where: { id },
        data: updateData,
        select: this.getProductSelect(),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
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
      select: { id: true, isActive: true },
    });
  }

  private getProductSelect() {
    return {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      comparePrice: true,
      stock: true,
      sku: true,
      images: true,
      categoryId: true,
      weight: true,
      dimensions: true,
      tags: true,
      seo: true,
      isActive: true,
      isFeatured: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    };
  }
}
