import { SuscriptorEventos } from '../../../shared/domain/eventos';
import { ClaseRepository } from '../domain/clase.repository';

// El contenido semanal pertenece a la materia: se borra con ella
export class BorrarContenidoAlEliminarMateria {
  constructor(
    private readonly eventos: SuscriptorEventos,
    private readonly clases: ClaseRepository,
  ) {}

  registrar(): void {
    this.eventos.suscribir('MateriaEliminada', ({ materiaId }) =>
      this.clases.eliminarDeMateria(materiaId),
    );
  }
}
