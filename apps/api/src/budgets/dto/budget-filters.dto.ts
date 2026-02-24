import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BudgetFiltersDto {
  @IsOptional()
  @IsEnum(['PENDING', 'QUOTED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'], {
    message: 'Estado inválido',
  })
  status?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID de propiedad inválido' })
  propertyId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Cursor inválido' })
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
