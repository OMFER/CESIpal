import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Rol } from '../../../shared/domain/actor';
import { LONGITUD_MINIMA_PASSWORD } from '../domain/usuario';

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsEmail()
  @IsNotEmpty()
  correo!: string;

  @IsString()
  @MinLength(LONGITUD_MINIMA_PASSWORD, {
    message: `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`,
  })
  password!: string;

  @IsEnum(Rol, { message: 'El rol debe ser "alumno", "maestro" o "admin"' })
  rol!: Rol;
}

export class ActualizarUsuarioDto extends PartialType(CrearUsuarioDto) {}
