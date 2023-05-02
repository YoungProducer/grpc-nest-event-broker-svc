import { RediSearchSchema, SchemaFieldTypes } from 'redis';

export const producerSchema: RediSearchSchema = {
  '$.id': {
    type: SchemaFieldTypes.TEXT,
  },
  '$.name': {
    type: SchemaFieldTypes.TEXT,
  },
};

export const consumerSchema: RediSearchSchema = {
  '$.id': {
    type: SchemaFieldTypes.TEXT,
  },
  '$.name': {
    type: SchemaFieldTypes.TEXT,
  },
  '$.producer': {
    type: SchemaFieldTypes.TEXT,
    AS: 'producer_id',
  },
};
