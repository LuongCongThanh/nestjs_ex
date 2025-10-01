import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Todo } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    return this.prisma.todo.create({
      data: this.mapCreateDto(createTodoDto),
    });
  }

  async findAll(): Promise<Todo[]> {
    return this.prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<Todo> {
    const todo = await this.prisma.todo.findUnique({ where: { id } });

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
    });
  }

  async remove(id: number): Promise<Todo> {
    await this.ensureExists(id);

    return this.prisma.todo.delete({ where: { id } });
  }

  private mapCreateDto(dto: CreateTodoDto): Prisma.TodoCreateInput {
    return {
      title: dto.title.trim(),
      description: this.normalizeDescription(dto.description),
      completed: dto.completed ?? false,
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
