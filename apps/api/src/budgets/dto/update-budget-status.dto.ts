import { IsEnum } from 'class-validator';

export class UpdateBudgetStatusDto {
  @IsEnum(['APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'], {
    message: 'Estado inválido',
  })
  status!: string;
}
