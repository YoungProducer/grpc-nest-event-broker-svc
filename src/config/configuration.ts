import { EnvVars } from './interfaces/env-vars.interface';

export default (): EnvVars => ({
  events_stream_key: 'event_broker',
  event_broker_cfg: {
    consumer_prefix: 'consumer',
    producer_prefix: 'producer',
  },
});
