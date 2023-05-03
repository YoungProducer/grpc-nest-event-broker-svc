import { RediSearchSchema, SchemaFieldTypes } from 'redis';

export const producerSchema: RediSearchSchema = {
  '$.name': {
    type: SchemaFieldTypes.TEXT,
  },
  '$.events': {
    type: SchemaFieldTypes.TEXT,
  },
};

export const consumerSchema: RediSearchSchema = {
  '$.name': {
    type: SchemaFieldTypes.TEXT,
  },
  '$.events': {
    type: SchemaFieldTypes.TEXT,
  },
};
