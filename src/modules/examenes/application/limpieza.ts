import { SuscriptorEventos } from '../../../shared/domain/eventos';
import {
  ExamenRepository,
  IntentoRepository,
} from '../domain/examen.repository';

/**
 * Los exámenes pertenecen a la materia y los intentos al grupo:
 * se borran cuando se borra lo que los contiene.
 */
export class LimpiezaDeExamenes {
  constructor(
    private readonly eventos: SuscriptorEventos,
    private readonly examenes: ExamenRepository,
    private readonly intentos: IntentoRepository,
  ) {}

  registrar(): void {
    this.eventos.suscribir('MateriaEliminada', ({ materiaId }) =>
      this.examenes.eliminarDeMateria(materiaId),
    );
    this.eventos.suscribir('GrupoEliminado', ({ grupoId }) =>
      this.intentos.eliminarDeGrupo(grupoId),
    );
  }
}
