import { RedisClientType } from 'redis';

export type RedisClientModuleGetter = () => Promise<RedisClientType>;
