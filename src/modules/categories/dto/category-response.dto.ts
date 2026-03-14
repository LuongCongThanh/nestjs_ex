import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

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
  @ApiProperty({ example: true })
  isActive: boolean;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
