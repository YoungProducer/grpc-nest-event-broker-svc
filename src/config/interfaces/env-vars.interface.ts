export interface EventBrokerCfg {
  producer_prefix: string;
  consumer_prefix: string;
}

export interface EnvVars {
  events_stream_key: string;
  event_broker_cfg: EventBrokerCfg;
}
