import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { TipoRecurso } from '../domain/clase';

@Schema({ _id: false })
export class LinksModelo {
  @Prop() enVivo?: string;
  @Prop() grabacion?: string;
  @Prop() descGrabacion?: string;
  @Prop() presentacion?: string;
}

@Schema({ _id: false })
export class RecursoModelo {
  @Prop({ type: String, required: true, enum: TipoRecurso })
  tipo!: TipoRecurso;

  @Prop({ required: true, trim: true })
  titulo!: string;

  @Prop({ required: true, trim: true })
  url!: string;

  @Prop({ trim: true })
  descripcion?: string;
}

@Schema({ collection: 'clases', timestamps: true })
export class ClaseModelo {
  @Prop({ type: Types.ObjectId, ref: 'MateriaModelo', required: true })
  materia!: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  semana!: number;

  @Prop({ required: true, trim: true })
  tema!: string;

  @Prop({ trim: true })
  introduccion?: string;

  @Prop({ type: [SchemaFactory.createForClass(RecursoModelo)], default: [] })
  recursos!: RecursoModelo[];

  @Prop({ type: Date })
  fechaEnVivo?: Date;

  @Prop({ type: SchemaFactory.createForClass(LinksModelo) })
  links?: LinksModelo;
}

export const ClaseSchema = SchemaFactory.createForClass(ClaseModelo);
ClaseSchema.index({ materia: 1, semana: 1 }, { unique: true });
