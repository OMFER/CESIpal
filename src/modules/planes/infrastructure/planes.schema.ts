import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { EstadoPlan } from '../domain/plan';

@Schema({ collection: 'planes', timestamps: true })
export class PlanModelo {
  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ trim: true })
  descripcion?: string;

  @Prop({ required: true, min: 1 })
  version!: number;

  @Prop({ type: String, required: true, enum: EstadoPlan })
  estado!: EstadoPlan;

  @Prop({ type: Date })
  publicadoEn?: Date;
}

export const PlanSchema = SchemaFactory.createForClass(PlanModelo);
// Dos copias simultáneas de un plan no pueden quedar con el mismo número de versión
PlanSchema.index({ nombre: 1, version: 1 }, { unique: true });

@Schema({ collection: 'materias', timestamps: true })
export class MateriaModelo {
  @Prop({ type: Types.ObjectId, ref: 'PlanModelo', required: true })
  plan!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ trim: true })
  descripcion?: string;

  @Prop({ required: true, min: 1 })
  bloque!: number;

  @Prop({ type: Types.ObjectId, ref: 'UsuarioModelo', index: true })
  maestro?: Types.ObjectId;
}

export const MateriaSchema = SchemaFactory.createForClass(MateriaModelo);
MateriaSchema.index({ plan: 1, bloque: 1 });

@Schema({ collection: 'grupos', timestamps: true })
export class GrupoModelo {
  @Prop({
    type: Types.ObjectId,
    ref: 'PlanModelo',
    required: true,
    index: true,
  })
  plan!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ type: Date, required: true })
  fechaInicio!: Date;
}

export const GrupoSchema = SchemaFactory.createForClass(GrupoModelo);
