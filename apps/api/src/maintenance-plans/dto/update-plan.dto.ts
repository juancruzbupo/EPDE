import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'ACTIVE', 'ARCHIVED'], { message: 'Estado inválido' })
  status?: string;
}
