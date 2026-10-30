import { Types } from 'mongoose';

export const aObjectId = (id: string): Types.ObjectId => new Types.ObjectId(id);

export const aObjectIds = (ids: string[]): Types.ObjectId[] =>
  ids.map(aObjectId);

export const esObjectIdValido = (id: string): boolean =>
  Types.ObjectId.isValid(id);
