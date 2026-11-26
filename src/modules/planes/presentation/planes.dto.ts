import { OmitType, PartialType, PickType } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { MAXIMO_BLOQUES } from '../domain/plan';

export class CrearPlanDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

// El nombre identifica al plan y a sus versiones: no se cambia
export class ActualizarPlanDto extends PickType(CrearPlanDto, [
  'descripcion',
] as const) {}

export class CrearMateriaDto {
  @IsMongoId({ message: 'planId debe ser un id válido' })
  planId!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  // 1 = semanas 1 y 2 del grupo, 2 = semanas 3 y 4…
  @IsInt()
  @Min(1)
  @Max(MAXIMO_BLOQUES)
  bloque!: number;

  @IsOptional()
  @IsMongoId({ message: 'maestroId debe ser un id válido' })
  maestroId?: string;
}

// La materia no cambia de plan; maestroId en null le quita el maestro
export class ActualizarMateriaDto extends PartialType(
  OmitType(CrearMateriaDto, ['planId', 'maestroId'] as const),
) {
  @IsOptional()
  @ValidateIf((_, valor) => valor !== null)
  @IsMongoId({ message: 'maestroId debe ser un id válido' })
  maestroId?: string | null;
}

export class CrearGrupoDto {
  @IsMongoId({ message: 'planId debe ser un id válido' })
  planId!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  // Un lunes, en formato YYYY-MM-DD
  @IsDateString({}, { message: 'fechaInicio debe ser una fecha (YYYY-MM-DD)' })
  fechaInicio!: string;
}

// El plan de un grupo no cambia
export class ActualizarGrupoDto extends PartialType(
  OmitType(CrearGrupoDto, ['planId'] as const),
) {}

export class InscribirAlumnosDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  alumnoIds!: string[];
}
