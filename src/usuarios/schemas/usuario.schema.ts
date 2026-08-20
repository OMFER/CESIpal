import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UsuarioDocument = Usuario & Document;

export enum Rol {
  ALUMNO = 'alumno',
  MAESTRO = 'maestro',
}

@Schema({ timestamps: true })
export class Usuario {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  correo: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: Rol, default: Rol.ALUMNO })
  rol: Rol;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Materia' }], default: [] })
  materias: Types.ObjectId[];
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
