import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateTodoDto,
  TODO_INCLUDE,
  TodoResponseDto,
  TodoWithOwner,
  UpdateTodoDto,
  toTodoResponse,
} from './dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTodoDto: CreateTodoDto): Promise<TodoResponseDto> {
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

    const todo = await this.prisma.todo.create({
      data: this.mapCreateDto(createTodoDto),
      include: TODO_INCLUDE,
    });

    return toTodoResponse(todo as TodoWithOwner);
  }

  async findAll(): Promise<TodoResponseDto[]> {
    const todos = await this.prisma.todo.findMany({
      include: TODO_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return todos.map((todo) => toTodoResponse(todo as TodoWithOwner));
  }

  async findAllByUser(userId: number): Promise<TodoResponseDto[]> {
    // Kiểm tra user tồn tại
    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const todos = await this.prisma.todo.findMany({
      where: { userId },
      include: TODO_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return todos.map((todo) => toTodoResponse(todo as TodoWithOwner));
  }

  async findOne(id: number): Promise<TodoResponseDto> {
    const todo = await this.prisma.todo.findUnique({
      where: { id },
      include: TODO_INCLUDE,
    });

    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }

    return toTodoResponse(todo as TodoWithOwner);
  }

  async update(
    id: number,
    updateTodoDto: UpdateTodoDto,
  ): Promise<TodoResponseDto> {
    await this.ensureExists(id);

    const todo = await this.prisma.todo.update({
      where: { id },
      data: this.mapUpdateDto(updateTodoDto),
      include: TODO_INCLUDE,
    });

    return toTodoResponse(todo as TodoWithOwner);
  }

  async remove(id: number): Promise<void> {
    await this.ensureExists(id);

    await this.prisma.todo.delete({ where: { id } });
  }

  private mapCreateDto(dto: CreateTodoDto): Prisma.TodoCreateInput {
    return {
      title: dto.title.trim(),
      description: this.normalizeDescription(dto.description),
      completed: dto.completed ?? false,
      user: {
        connect: {
          id: dto.userId,
        },
      },
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
