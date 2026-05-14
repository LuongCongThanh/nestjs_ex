import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ProductSeoDto {
  @ApiPropertyOptional({ example: 'iPhone 15 Pro Max', description: 'SEO Meta Title' })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  metaTitle?: string;

  @ApiPropertyOptional({ example: 'Buy the new iPhone 15 Pro Max today.', description: 'SEO Meta Description' })
  @IsString()
  @IsOptional()
  @MaxLength(160)
  metaDescription?: string;

  @ApiPropertyOptional({ example: 'iphone, apple, smartphone', description: 'SEO Meta Keywords' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  metaKeywords?: string;
}
