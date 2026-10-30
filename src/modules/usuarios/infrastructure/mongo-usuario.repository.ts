import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rol } from '../../../shared/domain/actor';
import {
  aObjectId,
  aObjectIds,
} from '../../../shared/infrastructure/mongo/object-id';
import { Usuario } from '../domain/usuario';
import {
  CredencialesUsuario,
  DatosUsuario,
  UsuarioRepository,
} from '../domain/usuario.repository';
import { UsuarioModelo } from './usuario.schema';
import { aUsuario, UsuarioPlano } from './usuario.mapper';

const SIN_PASSWORD = '-password';

@Injectable()
export class MongoUsuarioRepository implements UsuarioRepository {
  constructor(
    @InjectModel(UsuarioModelo.name)
    private readonly modelo: Model<UsuarioModelo>,
  ) {}

  async crear({ passwordHash, ...datos }: DatosUsuario): Promise<Usuario> {
    const doc = await this.modelo.create({ ...datos, password: passwordHash });
    return aUsuario(doc);
  }

  async actualizar(
    id: string,
    { passwordHash, ...datos }: Partial<DatosUsuario>,
  ): Promise<Usuario | null> {
    const cambios = passwordHash ? { ...datos, password: passwordHash } : datos;
    const doc = await this.modelo
      .findByIdAndUpdate(id, cambios, { new: true })
      .select(SIN_PASSWORD)
      .lean<UsuarioPlano>()
      .exec();
    return doc ? aUsuario(doc) : null;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const doc = await this.modelo
      .findById(id)
      .select(SIN_PASSWORD)
      .lean<UsuarioPlano>()
      .exec();
    return doc ? aUsuario(doc) : null;
  }

  async buscarPorIds(ids: string[]): Promise<Usuario[]> {
    const docs = await this.modelo
      .find({ _id: { $in: aObjectIds(ids) } })
      .select(SIN_PASSWORD)
      .lean<UsuarioPlano[]>()
      .exec();
    return docs.map(aUsuario);
  }

  async buscarCredenciales(
    correo: string,
  ): Promise<CredencialesUsuario | null> {
    const doc = await this.modelo
      .findOne({ correo })
      .lean<UsuarioPlano & { password: string }>()
      .exec();
    return doc ? { usuario: aUsuario(doc), passwordHash: doc.password } : null;
  }

  async existeCorreo(correo: string, excluirId?: string): Promise<boolean> {
    const filtro = excluirId
      ? { correo, _id: { $ne: aObjectId(excluirId) } }
      : { correo };
    return (await this.modelo.exists(filtro)) !== null;
  }

  async existeConRol(rol: Rol): Promise<boolean> {
    return (await this.modelo.exists({ rol })) !== null;
  }

  async listar(rol?: Rol): Promise<Usuario[]> {
    const docs = await this.modelo
      .find(rol ? { rol } : {})
      .select(SIN_PASSWORD)
      .sort({ nombre: 1 })
      .lean<UsuarioPlano[]>()
      .exec();
    return docs.map(aUsuario);
  }
}
