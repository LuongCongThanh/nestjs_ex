import { ApiProperty } from '@nestjs/swagger';

export class TodoEntity {
  @ApiProperty({
    description: 'Unique identifier for the todo',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Title of the todo',
    example: 'Buy groceries',
  })
  title: string;

  @ApiProperty({
    description: 'Description of the todo',
    example: 'Buy groceries for the week',
  })
  description: string;

  @ApiProperty({
    description: 'Whether the todo is completed',
    example: false,
  })
  completed: boolean;

  @ApiProperty({
    description: 'Timestamp when the todo was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
