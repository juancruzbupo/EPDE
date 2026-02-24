import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ServiceRequestFiltersDto {
  @IsOptional()
  @IsEnum(['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], {
    message: 'Estado inválido',
  })
  status?: string;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], { message: 'Urgencia inválida' })
  urgency?: string;

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
