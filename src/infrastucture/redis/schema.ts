import { RediSearchSchema, SchemaFieldTypes } from 'redis';

export const producerSchema: RediSearchSchema = {
  '$.name': {
    type: SchemaFieldTypes.TEXT,
    AS: 'name',
  },
  '$.events': {
    type: SchemaFieldTypes.TEXT,
    AS: 'events',
  },
};

export const consumerSchema: RediSearchSchema = {
  '$.name': {
    type: SchemaFieldTypes.TEXT,
    AS: 'name',
  },
  '$.events': {
    type: SchemaFieldTypes.TEXT,
    AS: 'events',
  },
};
