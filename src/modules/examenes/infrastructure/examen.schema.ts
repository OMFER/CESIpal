import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PUNTAJE_MAXIMO_POR_DEFECTO, TipoExamen } from '../domain/examen';

@Schema()
export class PreguntaModelo {
  @Prop({ required: true, trim: true })
  enunciado!: string;

  @Prop({ type: [String], required: true })
  opciones!: string[];

  @Prop({ required: true, min: 0 })
  respuestaCorrecta!: number;
}

// La colección conserva el nombre que Mongoose generó para el esquema anterior
@Schema({ collection: 'examens', timestamps: true })
export class ExamenModelo {
  @Prop({ type: Types.ObjectId, ref: 'MateriaModelo', required: true })
  materia!: Types.ObjectId;

  @Prop({ min: 1 })
  semana?: number;

  @Prop({ required: true, trim: true })
  titulo!: string;

  @Prop({ trim: true })
  descripcion?: string;

  @Prop({ required: true, enum: TipoExamen, default: TipoExamen.SEMANAL })
  tipo!: TipoExamen;

  @Prop({ type: Date })
  fechaLimite?: Date;

  @Prop({ required: true, default: PUNTAJE_MAXIMO_POR_DEFECTO })
  puntajeMaximo!: number;

  @Prop({ type: [SchemaFactory.createForClass(PreguntaModelo)], default: [] })
  preguntas!: PreguntaModelo[];
}

export const ExamenSchema = SchemaFactory.createForClass(ExamenModelo);
ExamenSchema.index(
  { materia: 1, semana: 1 },
  { unique: true, partialFilterExpression: { semana: { $exists: true } } },
);

@Schema({ collection: 'intentos', timestamps: true })
export class IntentoModelo {
  @Prop({ type: Types.ObjectId, ref: 'ExamenModelo', required: true })
  examen!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UsuarioModelo', required: true })
  alumno!: Types.ObjectId;

  @Prop({ type: [Number], required: true })
  respuestas!: number[];

  @Prop({ required: true })
  aciertos!: number;

  @Prop({ required: true })
  totalPreguntas!: number;

  @Prop({ required: true })
  calificacion!: number;
}

export const IntentoSchema = SchemaFactory.createForClass(IntentoModelo);
IntentoSchema.index({ examen: 1, alumno: 1 }, { unique: true });
