export const streamManagerErrorMsgs = {
  noListeners: (streamKey: string) =>
    `Stream ${streamKey} does not have any listeners!`,
  invalidConsumer: (streamKey: string, consumerId: string) =>
    `Consumer ${consumerId} is not subscribed to stream ${streamKey}!`,
};
