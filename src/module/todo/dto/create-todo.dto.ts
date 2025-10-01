import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTodoDto {
  @ApiProperty({
    description: 'Title of the todo',
    example: 'Buy groceries',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Description of the todo',
    example: 'Buy groceries for the week',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the todo is completed',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
