import { PartialType } from '@nestjs/mapped-types';
import { CreateExamenDto } from './create-examene.dto';

export class UpdateExameneDto extends PartialType(CreateExamenDto) { }
