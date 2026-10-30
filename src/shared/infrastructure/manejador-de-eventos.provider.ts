import { FactoryProvider, InjectionToken } from '@nestjs/common';

interface Registrable {
  registrar(): void;
}

type Constructor<T> = new (...args: any[]) => T;

/**
 * Crea un manejador de eventos de la capa de aplicación y lo suscribe en cuanto Nest arma el módulo,
 * sin que la clase tenga que conocer los hooks del framework.
 */
export function manejadorDeEventos<T extends Registrable>(
  clase: Constructor<T>,
  dependencias: InjectionToken[],
): FactoryProvider<T> {
  return {
    provide: clase,
    useFactory: (...instancias: unknown[]) => {
      const manejador = new clase(...instancias);
      manejador.registrar();
      return manejador;
    },
    inject: dependencias,
  };
}
