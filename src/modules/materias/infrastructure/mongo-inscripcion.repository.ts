import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rol } from '../../../shared/domain/actor';
import {
  aObjectId,
  aObjectIds,
} from '../../../shared/infrastructure/mongo/object-id';
import { Usuario } from '../../usuarios/domain/usuario';
import { UsuarioModelo } from '../../usuarios/infrastructure/usuario.schema';
import {
  aUsuario,
  UsuarioPlano,
} from '../../usuarios/infrastructure/usuario.mapper';
import { InscripcionRepository } from '../domain/inscripcion.repository';

// Las inscripciones se guardan en el arreglo `materias` de cada alumno
@Injectable()
export class MongoInscripcionRepository implements InscripcionRepository {
  constructor(
    @InjectModel(UsuarioModelo.name)
    private readonly usuarios: Model<UsuarioModelo>,
  ) {}

  async inscribir(alumnoIds: string[], materiaId: string): Promise<void> {
    await this.usuarios.updateMany(
      { _id: { $in: aObjectIds(alumnoIds) }, rol: Rol.ALUMNO },
      { $addToSet: { materias: aObjectId(materiaId) } },
    );
  }

  async darDeBaja(alumnoId: string, materiaId: string): Promise<void> {
    await this.usuarios.updateOne(
      { _id: aObjectId(alumnoId) },
      { $pull: { materias: aObjectId(materiaId) } },
    );
  }

  async estaInscrito(alumnoId: string, materiaId: string): Promise<boolean> {
    const existe = await this.usuarios.exists({
      _id: aObjectId(alumnoId),
      materias: aObjectId(materiaId),
    });
    return existe !== null;
  }

  async materiasDeAlumno(alumnoId: string): Promise<string[]> {
    const alumno = await this.usuarios
      .findById(alumnoId)
      .select('materias')
      .lean<UsuarioPlano>()
      .exec();
    return (alumno?.materias ?? []).map((m) => m.toString());
  }

  async alumnosDeMateria(materiaId: string): Promise<Usuario[]> {
    const docs = await this.usuarios
      .find({ rol: Rol.ALUMNO, materias: aObjectId(materiaId) })
      .select('-password')
      .sort({ nombre: 1 })
      .lean<UsuarioPlano[]>()
      .exec();
    return docs.map(aUsuario);
  }
}
