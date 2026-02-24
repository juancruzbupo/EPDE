import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsUUID('4', { message: 'ID de categoría inválido' })
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], { message: 'Prioridad inválida' })
  priority?: string;

  @IsOptional()
  @IsEnum(['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM'], {
    message: 'Tipo de recurrencia inválido',
  })
  recurrenceType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  recurrenceMonths?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha inválida' })
  nextDueDate?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'UPCOMING', 'OVERDUE', 'COMPLETED'], { message: 'Estado inválido' })
  status?: string;
}
