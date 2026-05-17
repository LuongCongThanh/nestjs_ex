import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'UUID of the shipping address', example: 'uuid-here' })
  @IsUUID()
  addressId: string;

  @ApiPropertyOptional({ example: 'Please leave at the door' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
