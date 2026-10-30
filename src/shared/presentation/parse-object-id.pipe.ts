import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const OBJECT_ID = /^[0-9a-f]{24}$/i;

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!OBJECT_ID.test(value)) {
      throw new BadRequestException(`"${value}" no es un id válido`);
    }
    return value;
  }
}
