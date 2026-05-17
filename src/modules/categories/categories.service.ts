import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildCategoryTree, applyDepthLimit } from '@common/utils/category-tree.util';
import { generateSlug } from '@common/utils/slug.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, slug, description, image, isActive, parentId } = createCategoryDto;

    // Generate slug if not provided
    const categorySlug = slug || generateSlug(name);

    // Check if slug exists
    const existing = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (existing) {
      throw new ConflictException(`Category with slug '${categorySlug}' already exists`);
    }

    // Validate parentId if provided
    if (parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw new NotFoundException(`Parent category with ID ${parentId} not found`);
      }
    }

    return await this.prisma.category.create({
      data: {
        name,
        slug: categorySlug,
        description,
        image,
        isActive: isActive ?? true,
        parentId,
      },
      select: this.getCategorySelect(),
    });
  }

  async findAll() {
    return await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: this.getCategorySelect(),
    });
  }

  /**
   * Returns a hierarchical tree of categories with advanced filtering
   */
  async getTree(query: CategoryQueryDto) {
    const { active, parentId, depth } = query;

    const rows = await this.prisma.category.findMany({
      where: active !== undefined ? { isActive: active } : {},
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        parentId: true,
        isActive: true,
      },
    });

    let tree = buildCategoryTree(rows, parentId);
    if (depth !== undefined) {
      tree = applyDepthLimit(tree, depth);
    }
    return tree;
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);

    if (updateCategoryDto.name && !updateCategoryDto.slug) {
      updateCategoryDto.slug = generateSlug(updateCategoryDto.name);
    }

    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      await this.validateHierarchy(id, updateCategoryDto.parentId);
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
        include: {
          parent: true,
          children: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Category slug already exists');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    if (category._count.products > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category._count.products} products. Move them first.`,
      );
    }

    if (category.children && category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with active children. Delete or move sub-categories first.',
      );
    }

    return await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  }

  private async validateHierarchy(categoryId: number, targetParentId: number) {
    let currentParentId: number | null = targetParentId;
    while (currentParentId) {
      const parentNode: any = await this.prisma.category.findUnique({
        where: { id: currentParentId },
        select: { id: true, parentId: true },
      });
      if (!parentNode) break;
      if (parentNode.parentId === categoryId) {
        throw new BadRequestException('Circular dependency detected: Parent can not be a descendant of the child.');
      }
      currentParentId = parentNode.parentId;
    }
  }

  private getCategorySelect() {
    return {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      isActive: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}
