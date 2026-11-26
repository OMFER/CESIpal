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

// Las inscripciones se guardan en el arreglo `grupos` de cada alumno
@Injectable()
export class MongoInscripcionRepository implements InscripcionRepository {
  constructor(
    @InjectModel(UsuarioModelo.name)
    private readonly usuarios: Model<UsuarioModelo>,
  ) {}

  async inscribir(alumnoIds: string[], grupoId: string): Promise<void> {
    await this.usuarios.updateMany(
      { _id: { $in: aObjectIds(alumnoIds) }, rol: Rol.ALUMNO },
      { $addToSet: { grupos: aObjectId(grupoId) } },
    );
  }

  async darDeBaja(alumnoId: string, grupoId: string): Promise<void> {
    await this.usuarios.updateOne(
      { _id: aObjectId(alumnoId) },
      { $pull: { grupos: aObjectId(grupoId) } },
    );
  }

  async vaciarGrupo(grupoId: string): Promise<void> {
    await this.usuarios.updateMany(
      { grupos: aObjectId(grupoId) },
      { $pull: { grupos: aObjectId(grupoId) } },
    );
  }

  async estaInscrito(alumnoId: string, grupoId: string): Promise<boolean> {
    const existe = await this.usuarios.exists({
      _id: aObjectId(alumnoId),
      grupos: aObjectId(grupoId),
    });
    return existe !== null;
  }

  async gruposDeAlumno(alumnoId: string): Promise<string[]> {
    const alumno = await this.usuarios
      .findById(alumnoId)
      .select('grupos')
      .lean<UsuarioPlano>()
      .exec();
    return (alumno?.grupos ?? []).map((g) => g.toString());
  }

  async alumnosDeGrupo(grupoId: string): Promise<Usuario[]> {
    const docs = await this.usuarios
      .find({ rol: Rol.ALUMNO, grupos: aObjectId(grupoId) })
      .select('-password')
      .sort({ nombre: 1 })
      .lean<UsuarioPlano[]>()
      .exec();
    return docs.map(aUsuario);
  }
}
