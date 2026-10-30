import {
  EventoDeDominio,
  Manejador,
  PublicadorEventos,
  SuscriptorEventos,
  TipoEvento,
} from '../domain/eventos';

// Ejecuta los manejadores en el mismo proceso y espera a que terminen antes de devolver el control
export class BusDeEventosEnMemoria
  implements PublicadorEventos, SuscriptorEventos
{
  private readonly manejadores = new Map<
    TipoEvento,
    ((evento: EventoDeDominio) => Promise<void>)[]
  >();

  suscribir<T extends TipoEvento>(tipo: T, manejador: Manejador<T>): void {
    const lista = this.manejadores.get(tipo) ?? [];
    lista.push(manejador as (evento: EventoDeDominio) => Promise<void>);
    this.manejadores.set(tipo, lista);
  }

  async publicar(evento: EventoDeDominio): Promise<void> {
    for (const manejador of this.manejadores.get(evento.tipo) ?? []) {
      await manejador(evento);
    }
  }
}
