// Hechos de negocio que otros módulos necesitan conocer sin depender del módulo que los produce
export type EventoDeDominio =
  | { tipo: 'MateriaEliminada'; materiaId: string }
  | { tipo: 'GrupoEliminado'; grupoId: string };

export type TipoEvento = EventoDeDominio['tipo'];

export type Manejador<T extends TipoEvento> = (
  evento: Extract<EventoDeDominio, { tipo: T }>,
) => Promise<void>;

export interface PublicadorEventos {
  publicar(evento: EventoDeDominio): Promise<void>;
}

export interface SuscriptorEventos {
  suscribir<T extends TipoEvento>(tipo: T, manejador: Manejador<T>): void;
}

export const PUBLICADOR_EVENTOS = Symbol('PublicadorEventos');
export const SUSCRIPTOR_EVENTOS = Symbol('SuscriptorEventos');
