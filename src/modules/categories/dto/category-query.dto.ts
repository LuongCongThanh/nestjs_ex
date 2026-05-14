import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CategoryQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by parent category ID',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  parentId?: number;

  @ApiPropertyOptional({
    description: 'Limit tree depth (1 = roots only, 2 = roots + direct children, etc.)',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  depth?: number;
}
