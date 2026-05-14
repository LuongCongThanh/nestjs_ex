import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
    const categorySlug = slug || this.generateSlug(name);

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

    // 1. Fetch all potentially relevant categories
    const allCategories = await this.prisma.category.findMany({
      where: {
        ...(active !== undefined ? { isActive: active } : {}),
      },
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

    // 2. Build the full map
    const categoryMap = new Map<number, any>();
    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // 3. Assemble tree and identify roots
    const roots: any[] = [];
    allCategories.forEach((cat) => {
      const node = categoryMap.get(cat.id);
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId).children.push(node);
      } else {
        if (!parentId || cat.id === parentId || !cat.parentId) {
          roots.push(node);
        }
      }
    });

    // 4. Sub-branch filtering
    let result = roots;
    if (parentId) {
      const specificBranch = categoryMap.get(parentId);
      result = specificBranch ? [specificBranch] : [];
    } else {
      result = roots.filter((r) => !r.parentId || (parentId && r.id === parentId));
    }

    // 5. Apply Depth Control
    if (depth !== undefined) {
      this.applyDepthLimit(result, depth);
    }

    return result;
  }

  private applyDepthLimit(nodes: any[], maxDepth: number, currentDepth = 1) {
    nodes.forEach((node) => {
      if (currentDepth >= maxDepth) {
        node.children = [];
      } else if (node.children && node.children.length > 0) {
        this.applyDepthLimit(node.children, maxDepth, currentDepth + 1);
      }
    });
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
      updateCategoryDto.slug = this.generateSlug(updateCategoryDto.name);
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
    const category = (await this.findOne(id)) as any;

    if (category._count.products > 0) {
      throw new BadRequestException(`Cannot delete category with ${category._count.products} products. Move them first.`);
    }

    if (category.children && category.children.length > 0) {
      throw new BadRequestException('Cannot delete category with active children. Delete or move sub-categories first.');
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

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^\w ]+/g, '')
      .trim()
      .replace(/ +/g, '-');
  }
}
