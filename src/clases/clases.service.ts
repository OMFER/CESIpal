import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Clase, ClaseDocument } from './schemas/clase.schema';
import { CreateClaseDto } from './dto/create-clase.dto';

@Injectable()
export class ClasesService {
  constructor(
    @InjectModel(Clase.name)
    private readonly claseModel: Model<ClaseDocument>,
  ) { }

  async create(createClaseDto: CreateClaseDto): Promise<Clase> {
    const nuevaClase = new this.claseModel({
      ...createClaseDto,
      materia: new Types.ObjectId(createClaseDto.materiaId),
    });
    return nuevaClase.save();
  }

  async findByMateria(materiaId: string): Promise<Clase[]> {
    return this.claseModel
      .find({ materia: new Types.ObjectId(materiaId) })
      .exec();
  }
}