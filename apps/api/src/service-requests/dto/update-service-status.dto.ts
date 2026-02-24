import { IsEnum } from 'class-validator';

export class UpdateServiceStatusDto {
  @IsEnum(['IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], {
    message: 'Estado inválido',
  })
  status!: string;
}
