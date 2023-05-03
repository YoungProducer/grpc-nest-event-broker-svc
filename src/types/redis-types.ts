export type RedisCommandArgument = string | Buffer;

export interface StreamMessageReply {
  id: RedisCommandArgument;
  message: Record<string, RedisCommandArgument>;
}
export type StreamMessagesReply = Array<StreamMessageReply>;

export type StreamsMessagesReply = Array<{
  name: string | Buffer;
  messages: StreamMessagesReply;
}> | null;
