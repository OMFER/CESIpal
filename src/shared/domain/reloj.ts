// Permite que las reglas que dependen de la fecha (semana actual, fecha límite) se prueben sin esperar
export interface Reloj {
  ahora(): Date;
}

export const RELOJ = Symbol('Reloj');
