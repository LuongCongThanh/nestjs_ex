import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'iPhone 15 Pro Max',
    description: 'Product name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name: string;

  @ApiPropertyOptional({
    example: 'iphone-15-pro-max',
    description: 'Product slug (auto-generated if not provided)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  slug?: string;

  @ApiPropertyOptional({
    example: 'The latest iPhone with A17 Pro chip',
    description: 'Product description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 1000,
    description: 'Product price',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: 1200,
    description: 'Product comparison price',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @ApiProperty({
    example: 10,
    description: 'Product stock quantity',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  stock: number;

  @ApiProperty({
    example: 'IPH15PM256',
    description: 'Product SKU',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({
    example: ['https://example.com/image1.jpg'],
    description: 'Product images',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiProperty({
    example: 1,
    description: 'Category identifier',
  })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @ApiPropertyOptional({
    example: 0.5,
    description: 'Product weight',
  })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({
    example: { length: 1, width: 1, height: 1 },
    description: 'Product dimensions',
  })
  @IsOptional()
  dimensions?: any;

  @ApiPropertyOptional({
    example: ['apple', 'phone'],
    description: 'Product tags',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({
    example: { metaTitle: 'iPhone 15', metaDescription: 'Buy iPhone 15' },
    description: 'SEO metadata',
  })
  @IsOptional()
  seo?: any;

  @ApiPropertyOptional({
    example: true,
    description: 'Product status',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Is featured product',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
