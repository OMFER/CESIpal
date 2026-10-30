export enum Rol {
  ALUMNO = 'alumno',
  MAESTRO = 'maestro',
  ADMIN = 'admin',
}

// Quién ejecuta un caso de uso; lo construye la capa de presentación a partir de la sesión
export interface Actor {
  id: string;
  correo: string;
  rol: Rol;
}
