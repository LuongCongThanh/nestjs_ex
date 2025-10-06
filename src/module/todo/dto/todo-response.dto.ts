import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export const TODO_OWNER_SELECT = {
  id: true,
  fullName: true,
  email: true,
} as const satisfies Prisma.UserSelect;

export const TODO_INCLUDE = {
  user: {
    select: TODO_OWNER_SELECT,
  },
} as const;

export type TodoWithOwner = Prisma.TodoGetPayload<{
  include: typeof TODO_INCLUDE;
}>;

class TodoOwnerDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'John Doe' })
  fullName!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;
}

export class TodoResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Buy groceries' })
  title!: string;

  @ApiPropertyOptional({ example: 'Milk, bread, eggs', nullable: true })
  description!: string | null;

  @ApiProperty({ example: false })
  completed!: boolean;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ type: () => TodoOwnerDto })
  user!: TodoOwnerDto;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T12:00:00.000Z' })
  updatedAt!: Date;
}

export function toTodoResponse(todo: TodoWithOwner): TodoResponseDto {
  const { user, ...rest } = todo;
  return {
    ...rest,
    user: { ...user },
  };
}
