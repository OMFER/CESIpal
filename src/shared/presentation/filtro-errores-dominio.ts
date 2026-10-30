import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ConflictoError,
  DatosInvalidosError,
  ErrorDeDominio,
  NoAutenticadoError,
  NoEncontradoError,
  SinPermisoError,
} from '../domain/errores';

type ClaseDeError = abstract new (...args: never[]) => ErrorDeDominio;

const ESTADOS: [ClaseDeError, { status: HttpStatus; error: string }][] = [
  [
    NoAutenticadoError,
    { status: HttpStatus.UNAUTHORIZED, error: 'Unauthorized' },
  ],
  [NoEncontradoError, { status: HttpStatus.NOT_FOUND, error: 'Not Found' }],
  [SinPermisoError, { status: HttpStatus.FORBIDDEN, error: 'Forbidden' }],
  [ConflictoError, { status: HttpStatus.CONFLICT, error: 'Conflict' }],
  [
    DatosInvalidosError,
    { status: HttpStatus.BAD_REQUEST, error: 'Bad Request' },
  ],
];

// Traduce los errores de negocio al mismo formato de respuesta que usan las excepciones de Nest
@Catch(ErrorDeDominio)
export class FiltroErroresDominio implements ExceptionFilter {
  catch(error: ErrorDeDominio, host: ArgumentsHost) {
    const { status, error: nombre } = ESTADOS.find(
      ([clase]) => error instanceof clase,
    )?.[1] ?? {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
    };
    host.switchToHttp().getResponse<Response>().status(status).json({
      statusCode: status,
      message: error.message,
      error: nombre,
    });
  }
}
