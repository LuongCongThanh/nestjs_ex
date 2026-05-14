import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'Shipping address snapshot' })
  @IsObject()
  shippingAddress: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Please leave at the door' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
