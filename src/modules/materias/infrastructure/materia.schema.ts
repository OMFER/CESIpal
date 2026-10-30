import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { SEMANAS_POR_DEFECTO } from '../domain/materia';

@Schema({ collection: 'materias', timestamps: true })
export class MateriaModelo {
  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ trim: true })
  descripcion?: string;

  @Prop({ trim: true })
  grupo?: string;

  @Prop({ trim: true })
  aula?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'UsuarioModelo',
    required: true,
    index: true,
  })
  maestro!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  fechaInicio!: Date;

  @Prop({ required: true, default: SEMANAS_POR_DEFECTO, min: 1 })
  totalSemanas!: number;
}

export const MateriaSchema = SchemaFactory.createForClass(MateriaModelo);
