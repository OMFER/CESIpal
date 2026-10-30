import { FactoryProvider, InjectionToken } from '@nestjs/common';

type Constructor<T> = new (...args: any[]) => T;

/**
 * Registra en Nest una clase de la capa de aplicación sin que esta tenga que importar
 * decoradores del framework: sus dependencias se pasan por constructor en el orden de `dependencias`.
 */
export function casoDeUso<T>(
  clase: Constructor<T>,
  dependencias: InjectionToken[],
): FactoryProvider<T> {
  return {
    provide: clase,
    useFactory: (...instancias: unknown[]) => new clase(...instancias),
    inject: dependencias,
  };
}
