import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'Category name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'electronics',
    description: 'Category slug (auto-generated if not provided)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    example: 'Electronic products and accessories',
    description: 'Category description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/category-image.jpg',
    description: 'Category image URL',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Parent category ID',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Category status',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
