import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

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

  // Semana de la materia (1 o 2) y número de examen dentro de ella (1 o 2)
  @Prop({ required: true, min: 1 })
  semana!: number;

  @Prop({ required: true, min: 1 })
  numero!: number;

  @Prop({ required: true, trim: true })
  titulo!: string;

  @Prop({ trim: true })
  descripcion?: string;

  @Prop({ required: true, default: 0, min: 0 })
  diasExtra!: number;

  @Prop({ type: [SchemaFactory.createForClass(PreguntaModelo)], default: [] })
  preguntas!: PreguntaModelo[];
}

export const ExamenSchema = SchemaFactory.createForClass(ExamenModelo);
// Un examen 1 y un examen 2 por semana de la materia
ExamenSchema.index({ materia: 1, semana: 1, numero: 1 }, { unique: true });

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
// Cada alumno responde una sola vez cada examen en su grupo, aunque mande dos veces la respuesta
IntentoSchema.index({ examen: 1, grupo: 1, alumno: 1 }, { unique: true });
IntentoSchema.index({ grupo: 1, alumno: 1 });
