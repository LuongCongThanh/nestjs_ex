import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { CategoryResponseDto } from '@modules/categories/dto/category-response.dto';

@Exclude()
export class ProductResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
// ... (rest same, except types)
  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'iphone-15-pro-max' })
  slug: string;

  @Expose()
  @ApiPropertyOptional({ example: 'The latest iPhone' })
  description?: string;

  @Expose()
  @ApiProperty({ example: 1000 })
  price: number;

  @Expose()
  @ApiPropertyOptional({ example: 1200 })
  comparePrice?: number;

  @Expose()
  @ApiProperty({ example: 10 })
  stock: number;

  @Expose()
  @ApiProperty({ example: 'IPH15PM256' })
  sku: string;

  @Expose()
  @ApiPropertyOptional({ type: [String] })
  images?: string[];

  @Expose()
  @ApiProperty({ example: 1 })
  categoryId: number;

  @Expose()
  @ApiPropertyOptional({ example: 0.5 })
  weight?: number;

  @Expose()
  @ApiPropertyOptional()
  dimensions?: any;

  @Expose()
  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @Expose()
  @ApiPropertyOptional()
  seo?: any;

  @Expose()
  @ApiProperty({ example: true })
  isActive: boolean;

  @Expose()
  @ApiProperty({ example: false })
  isFeatured: boolean;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  @Expose()
  @Type(() => CategoryResponseDto)
  @ApiPropertyOptional({ type: () => CategoryResponseDto })
  category?: CategoryResponseDto;
}
