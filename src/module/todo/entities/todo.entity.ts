import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UserInfo {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;
}

export class TodoEntity {
  @ApiProperty({
    description: 'Unique identifier for the todo',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Title of the todo',
    example: 'Buy groceries',
    maxLength: 255,
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the todo',
    example: 'Buy groceries for the week',
    maxLength: 2000,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Whether the todo is completed',
    example: false,
  })
  completed: boolean;

  @ApiProperty({
    description: 'ID of the user who owns this todo',
    example: 1,
  })
  userId: number;

  @ApiPropertyOptional({
    description: 'User information',
    type: UserInfo,
  })
  user?: UserInfo;

  @ApiProperty({
    description: 'Timestamp when the todo was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the todo was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
