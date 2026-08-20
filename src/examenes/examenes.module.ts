import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamenesService } from './examenes.service';
import { ExamenesController } from './examenes.controller';
import { Examen, ExamenSchema } from './schemas/examen.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Examen.name, schema: ExamenSchema }]),
  ],
  controllers: [ExamenesController],
  providers: [ExamenesService],
  exports: [ExamenesService, MongooseModule],
})
export class ExamenesModule { }