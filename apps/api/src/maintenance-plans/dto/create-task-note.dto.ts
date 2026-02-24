import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTaskNoteDto {
  @IsString()
  @MinLength(1, { message: 'El contenido es requerido' })
  @MaxLength(2000)
  content!: string;
}
