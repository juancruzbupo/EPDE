import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class BudgetLineItemDto {
  @IsString()
  description!: string;

  @IsNumber()
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  quantity!: number;

  @IsNumber()
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  unitPrice!: number;
}

export class RespondBudgetDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetLineItemDto)
  lineItems!: BudgetLineItemDto[];

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Los días estimados deben ser al menos 1' })
  estimatedDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Las notas no pueden superar 2000 caracteres' })
  notes?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de validez inválida' })
  validUntil?: string;
}
