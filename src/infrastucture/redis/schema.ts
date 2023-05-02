import { RediSearchSchema, SchemaFieldTypes } from 'redis';

export const schema: RediSearchSchema = {
  '$.id': {
    type: SchemaFieldTypes.TEXT,
  },
  '$.name': {
    type: SchemaFieldTypes.TEXT,
  },
};
