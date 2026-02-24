import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'La dirección debe tener al menos 3 caracteres' })
  address?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'La ciudad debe tener al menos 2 caracteres' })
  city?: string;

  @IsOptional()
  @IsEnum(['HOUSE', 'APARTMENT', 'DUPLEX', 'COUNTRY_HOUSE', 'OTHER'], {
    message: 'Tipo de propiedad inválido',
  })
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  yearBuilt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  squareMeters?: number;
}
