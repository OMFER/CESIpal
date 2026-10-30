import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Rol } from '../../../shared/domain/actor';

export type UsuarioDocument = HydratedDocument<UsuarioModelo>;

@Schema({ collection: 'usuarios', timestamps: true })
export class UsuarioModelo {
  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  correo!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ type: String, required: true, enum: Rol, default: Rol.ALUMNO })
  rol!: Rol;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'GrupoModelo' }], default: [] })
  grupos!: Types.ObjectId[];
}

export const UsuarioSchema = SchemaFactory.createForClass(UsuarioModelo);
UsuarioSchema.index({ rol: 1, grupos: 1 });
