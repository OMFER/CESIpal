import { OmitType, PartialType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EXAMENES_POR_SEMANA,
  SEMANAS_POR_MATERIA,
} from '../../planes/domain/plan';
import {
  MAXIMO_DIAS_EXTRA,
  MAXIMO_OPCIONES,
  MINIMO_OPCIONES,
} from '../domain/examen';

// Los exámenes de una materia caben de sobra; coincide con el límite del cuerpo de la petición
const MAXIMO_CSV = 100_000;

export class PreguntaDto {
  @IsString()
  @IsNotEmpty()
  enunciado!: string;

  @IsArray()
  @ArrayMinSize(MINIMO_OPCIONES, {
    message: `Cada pregunta necesita al menos ${MINIMO_OPCIONES} opciones`,
  })
  @ArrayMaxSize(MAXIMO_OPCIONES, {
    message: `Cada pregunta admite máximo ${MAXIMO_OPCIONES} opciones`,
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  opciones!: string[];

  @IsInt()
  @Min(0)
  respuestaCorrecta!: number;
}

export class CrearExamenDto {
  @IsMongoId()
  @IsNotEmpty()
  materiaId!: string;

  // Semana de la materia
  @IsInt()
  @Min(1)
  @Max(SEMANAS_POR_MATERIA)
  semana!: number;

  // Examen 1 (abre el lunes) o 2 (abre el jueves)
  @IsInt()
  @Min(1)
  @Max(EXAMENES_POR_SEMANA)
  numero!: number;

  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  // Días de prórroga sobre la ventana normal del examen
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAXIMO_DIAS_EXTRA)
  diasExtra?: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'El examen necesita al menos una pregunta' })
  @ValidateNested({ each: true })
  @Type(() => PreguntaDto)
  preguntas!: PreguntaDto[];
}

// La materia, la semana y el número identifican al examen: no se cambian
export class ActualizarExamenDto extends PartialType(
  OmitType(CrearExamenDto, ['materiaId', 'semana', 'numero'] as const),
) {}

export class ImportarExamenesDto {
  // Contenido del CSV exportado de la plantilla de Google Sheets
  @IsString()
  @IsNotEmpty({ message: 'El archivo está vacío' })
  @MaxLength(MAXIMO_CSV, { message: 'El archivo es demasiado grande' })
  csv!: string;
}

export class ResponderExamenDto {
  // Índice de la opción elegida por pregunta, en el orden en que se recibieron
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  respuestas!: number[];
}
