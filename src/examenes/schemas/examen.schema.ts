import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExamenDocument = Examen & Document;

export enum TipoExamen {
  PARCIAL = 'Parcial',
  FINAL = 'Final',
  PUNTO_EXTRA = 'PuntoExtra',
}

@Schema({ timestamps: true })
export class Examen {
  @Prop({ type: Types.ObjectId, ref: 'Materia', required: true })
  materia: Types.ObjectId;

  @Prop({ required: true, trim: true })
  titulo: string;

  @Prop({ trim: true })
  descripcion?: string;

  @Prop({ required: true, enum: TipoExamen, default: TipoExamen.PARCIAL })
  tipo: TipoExamen;

  @Prop({ type: Date })
  fechaLimite?: Date;

  @Prop({ required: true, default: 100 })
  puntajeMaximo: number;
}

export const ExamenSchema = SchemaFactory.createForClass(Examen);