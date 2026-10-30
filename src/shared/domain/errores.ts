// Errores de negocio. No conocen HTTP: la capa de presentación los traduce a códigos de estado.
export abstract class ErrorDeDominio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class NoAutenticadoError extends ErrorDeDominio {}

export class NoEncontradoError extends ErrorDeDominio {}

export class SinPermisoError extends ErrorDeDominio {}

export class ConflictoError extends ErrorDeDominio {}

export class DatosInvalidosError extends ErrorDeDominio {}
