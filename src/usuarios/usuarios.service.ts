import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    const { correo, password, ...resto } = createUsuarioDto;
    const usuarioExiste = await this.usuarioModel.findOne({ correo });

    if (usuarioExiste) {
      throw new ConflictException('El correo ya está registrado');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = new this.usuarioModel({
      ...resto,
      correo,
      password: hashedPassword,
    });

    return nuevoUsuario.save();
  }

  async findByCorreo(correo: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findOne({ correo }).exec();
  }

  async findById(id: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findById(id).select('-password').exec();
  }
}
