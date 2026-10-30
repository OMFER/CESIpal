import { Types } from 'mongoose';
import { Rol } from '../../../shared/domain/actor';
import { Usuario } from '../domain/usuario';

export interface UsuarioPlano {
  _id: Types.ObjectId;
  nombre: string;
  correo: string;
  rol: Rol;
  materias?: Types.ObjectId[];
}

export function aUsuario(doc: UsuarioPlano): Usuario {
  return {
    id: doc._id.toString(),
    nombre: doc.nombre,
    correo: doc.correo,
    rol: doc.rol,
    materiaIds: (doc.materias ?? []).map((m) => m.toString()),
  };
}
