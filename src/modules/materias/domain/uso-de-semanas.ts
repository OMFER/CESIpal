// Hasta qué semana una materia ya tiene contenido o exámenes (0 si ninguna)
export interface UsoDeSemanas {
  ultimaSemanaOcupada(materiaId: string): Promise<number>;
}

export const USO_DE_SEMANAS = Symbol('UsoDeSemanas');
