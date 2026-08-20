import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClaseDocument = Clase & Document;

@Schema({ _id: false })
export class LinksClase {
  @Prop() enVivo?: string;
  @Prop() grabacion?: string;
  @Prop() descGrabacion?: string;
  @Prop() presentacion?: string;
}

@Schema({ timestamps: true })
export class Clase {
  @Prop({ type: Types.ObjectId, ref: 'Materia', required: true })
  materia: Types.ObjectId;

  @Prop({ required: true, trim: true })
  tema: string;

  @Prop({ type: Date })
  fechaEnVivo?: Date;

  @Prop({ type: LinksClase })
  links?: LinksClase;
}

export const ClaseSchema = SchemaFactory.createForClass(Clase);