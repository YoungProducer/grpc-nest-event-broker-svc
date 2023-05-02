import { RediSearchSchema, SchemaFieldTypes } from 'redis';

export const producerSchema: RediSearchSchema = {
  '$.name': {
    type: SchemaFieldTypes.TEXT,
  },
};

export const consumerSchema: RediSearchSchema = {
  '$.name': {
    type: SchemaFieldTypes.TEXT,
  },
  '$.producer': {
    type: SchemaFieldTypes.TEXT,
    AS: 'producer_id',
  },
};
