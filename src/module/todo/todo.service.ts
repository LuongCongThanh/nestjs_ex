import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Todo } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    // Kiểm tra user tồn tại
    const userExists = await this.prisma.user.findUnique({
      where: { id: createTodoDto.userId },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException(
        `User with id ${createTodoDto.userId} not found`,
      );
    }

    return this.prisma.todo.create({
      data: this.mapCreateDto(createTodoDto),
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(): Promise<Todo[]> {
    return this.prisma.todo.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByUser(userId: number): Promise<Todo[]> {
    // Kiểm tra user tồn tại
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return this.prisma.todo.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<Todo> {
    const todo = await this.prisma.todo.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }

    return todo;
  }

  async update(id: number, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    await this.ensureExists(id);

    return this.prisma.todo.update({
      where: { id },
      data: this.mapUpdateDto(updateTodoDto),
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: number): Promise<Todo> {
    await this.ensureExists(id);

    return this.prisma.todo.delete({ where: { id } });
  }

  private mapCreateDto(dto: CreateTodoDto): Prisma.TodoUncheckedCreateInput {
    return {
      title: dto.title.trim(),
      description: this.normalizeDescription(dto.description),
      completed: dto.completed ?? false,
      userId: dto.userId,
    };
  }

  private mapUpdateDto(dto: UpdateTodoDto): Prisma.TodoUpdateInput {
    const data: Prisma.TodoUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      data.description = this.normalizeDescription(dto.description);
    }

    if (dto.completed !== undefined) {
      data.completed = dto.completed;
    }

    return data;
  }

  private normalizeDescription(description?: string | null): string | null {
    if (description === undefined || description === null) {
      return null;
    }

    const trimmed = description.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private async ensureExists(id: number): Promise<void> {
    const exists = await this.prisma.todo.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
  }
}
