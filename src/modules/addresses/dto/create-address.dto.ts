import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: '123 Nguyen Hue' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 'Ben Nghe' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ example: 'District 1' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'Ho Chi Minh City' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Vietnam' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ example: '700000' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
