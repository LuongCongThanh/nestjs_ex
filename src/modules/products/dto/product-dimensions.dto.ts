import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class ProductDimensionsDto {
  @ApiPropertyOptional({ example: 10.5, description: 'Length in cm' })
  @IsNumber()
  @IsOptional()
  length?: number;

  @ApiPropertyOptional({ example: 5.2, description: 'Width in cm' })
  @IsNumber()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({ example: 2.0, description: 'Height in cm' })
  @IsNumber()
  @IsOptional()
  height?: number;
}
