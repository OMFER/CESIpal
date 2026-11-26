import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import type {
  AccionRegistrada,
  EntidadRegistrada,
} from '../../domain/bitacora';

@Schema({
  collection: 'bitacora',
  timestamps: { createdAt: true, updatedAt: false },
})
export class CambioModelo {
  @Prop({ type: Types.ObjectId, ref: 'PlanModelo', required: true })
  plan!: Types.ObjectId;

  @Prop({ type: String, required: true })
  entidad!: EntidadRegistrada;

  @Prop({ type: Types.ObjectId, required: true })
  entidadId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  accion!: AccionRegistrada;

  @Prop({ type: Types.ObjectId, ref: 'UsuarioModelo', required: true })
  autor!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed })
  antes?: unknown;

  @Prop({ type: MongooseSchema.Types.Mixed })
  despues?: unknown;
}

export const CambioSchema = SchemaFactory.createForClass(CambioModelo);
CambioSchema.index({ plan: 1, createdAt: -1 });
