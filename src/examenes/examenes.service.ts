import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Examen, ExamenDocument } from './schemas/examen.schema';
import { CreateExamenDto } from './dto/create-examene.dto';

@Injectable()
export class ExamenesService {
  constructor(
    @InjectModel(Examen.name)
    private readonly examenModel: Model<ExamenDocument>,
  ) { }

  async create(createExamenDto: CreateExamenDto): Promise<Examen> {
    const nuevoExamen = new this.examenModel({
      ...createExamenDto,
      materia: new Types.ObjectId(createExamenDto.materiaId),
    });
    return nuevoExamen.save();
  }

  async findByMateria(materiaId: string): Promise<Examen[]> {
    return this.examenModel
      .find({ materia: new Types.ObjectId(materiaId) })
      .exec();
  }
}