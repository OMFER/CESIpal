import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClasesService } from './clases.service';
import { ClasesController } from './clases.controller';
import { Clase, ClaseSchema } from './schemas/clase.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Clase.name, schema: ClaseSchema }]),
  ],
  controllers: [ClasesController],
  providers: [ClasesService],
  exports: [ClasesService, MongooseModule],
})
export class ClasesModule { }