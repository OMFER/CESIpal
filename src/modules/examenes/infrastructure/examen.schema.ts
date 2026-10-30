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

@Schema({ collection: 'examenes', timestamps: true })
export class ExamenModelo {
  @Prop({ type: Types.ObjectId, ref: 'MateriaModelo', required: true })
  materia!: Types.ObjectId;

  @Prop({ type: String, required: true, enum: TipoExamen })
  tipo!: TipoExamen;

  @Prop({ min: 1 })
  semana?: number;

  @Prop({ required: true, trim: true })
  titulo!: string;

  @Prop({ trim: true })
  descripcion?: string;

  @Prop({ required: true, default: PUNTAJE_MAXIMO_POR_DEFECTO })
  puntajeMaximo!: number;

  @Prop({ required: true, default: 0, min: 0 })
  diasExtra!: number;

  @Prop({ type: [SchemaFactory.createForClass(PreguntaModelo)], default: [] })
  preguntas!: PreguntaModelo[];
}

export const ExamenSchema = SchemaFactory.createForClass(ExamenModelo);
// Un examen de cada tipo por semana, y un solo Final (sin semana) por materia
ExamenSchema.index({ materia: 1, tipo: 1, semana: 1 }, { unique: true });

@Schema({ collection: 'intentos', timestamps: true })
export class IntentoModelo {
  @Prop({ type: Types.ObjectId, ref: 'ExamenModelo', required: true })
  examen!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'GrupoModelo', required: true })
  grupo!: Types.ObjectId;

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
IntentoSchema.index({ examen: 1, grupo: 1, alumno: 1 }, { unique: true });
IntentoSchema.index({ grupo: 1, alumno: 1 });
