import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ClientFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['INVITED', 'ACTIVE', 'INACTIVE'], { message: 'Estado inválido' })
  status?: string;

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
