import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, slug, description, image, isActive } = createCategoryDto;

    // Generate slug if not provided
    const categorySlug = slug || this.generateSlug(name);

    // Check if slug exists
    const existing = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (existing) {
      throw new ConflictException(`Category with slug '${categorySlug}' already exists`);
    }

    return await this.prisma.category.create({
      data: {
        name,
        slug: categorySlug,
        description,
        image,
        isActive: isActive ?? true,
      },
    });
  }

  async findAll() {
    return await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { products: { where: { isActive: true } } },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    if (updateCategoryDto.name && !updateCategoryDto.slug) {
      updateCategoryDto.slug = this.generateSlug(updateCategoryDto.name);
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category slug already exists');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
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
