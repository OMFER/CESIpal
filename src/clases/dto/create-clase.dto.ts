import { IsMongoId, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class LinksDto {
  @IsOptional()
  @IsUrl({}, { message: 'El enlace en vivo debe ser una URL válida' })
  enVivo?: string;

  @IsOptional()
  @IsUrl({}, { message: 'El enlace de la grabación debe ser una URL válida' })
  grabacion?: string;

  @IsOptional()
  @IsString()
  descGrabacion?: string;

  @IsOptional()
  @IsUrl({}, { message: 'El enlace de la presentación debe ser una URL válida' })
  presentacion?: string;
}

export class CreateClaseDto {
  @IsMongoId()
  @IsNotEmpty()
  materiaId: string;

  @IsString()
  @IsNotEmpty()
  tema: string;

  @IsOptional()
  @IsDateString()
  fechaEnVivo?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LinksDto)
  links?: LinksDto;
}