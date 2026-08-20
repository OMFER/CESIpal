import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { TipoExamen } from '../schemas/examen.schema';

export class CreateExamenDto {
  @IsMongoId()
  @IsNotEmpty()
  materiaId: string;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsEnum(TipoExamen, { message: 'El tipo debe ser Parcial, Final o PuntoExtra' })
  tipo: TipoExamen;

  @IsOptional()
  @IsDateString()
  fechaLimite?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  puntajeMaximo?: number;
}