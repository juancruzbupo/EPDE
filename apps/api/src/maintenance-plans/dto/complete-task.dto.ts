import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CompleteTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL de foto inválida' })
  photoUrl?: string;
}
