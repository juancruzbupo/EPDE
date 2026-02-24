import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateBudgetRequestDto {
  @IsUUID('4', { message: 'ID de propiedad inválido' })
  propertyId!: string;

  @IsString()
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'El título no puede superar 200 caracteres' })
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'La descripción no puede superar 2000 caracteres' })
  description?: string;
}
