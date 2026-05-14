import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class CategoryResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'Electronics' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'electronics' })
  slug: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Electronic products and accessories' })
  description?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'https://example.com/category-image.jpg' })
  image?: string;

  @Expose()
  @ApiPropertyOptional({ example: 1 })
  parentId?: number;

  @Expose()
  @ApiProperty({ example: true })
  isActive: boolean;

  @Expose()
  @Type(() => CategoryResponseDto)
  @ApiPropertyOptional({ type: () => CategoryResponseDto })
  parent?: CategoryResponseDto;

  @Expose()
  @Type(() => CategoryResponseDto)
  @ApiPropertyOptional({ type: () => [CategoryResponseDto] })
  children?: CategoryResponseDto[];

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
