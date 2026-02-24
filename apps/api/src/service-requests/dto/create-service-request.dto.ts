import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  IsUUID,
  ArrayMaxSize,
} from 'class-validator';

export class CreateServiceRequestDto {
  @IsUUID('4', { message: 'ID de propiedad inválido' })
  propertyId!: string;

  @IsString()
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'El título no puede superar 200 caracteres' })
  title!: string;

  @IsString()
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  @MaxLength(2000, { message: 'La descripción no puede superar 2000 caracteres' })
  description!: string;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], { message: 'Urgencia inválida' })
  urgency?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Máximo 5 fotos' })
  @IsUrl({}, { each: true, message: 'URL de foto inválida' })
  photoUrls?: string[];
}
