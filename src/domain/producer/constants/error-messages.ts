export const producerServiceErrorMsgs = {
  notRegistered: (id: string) => `Producer with id: ${id} is not registered!`,
  cannotProduceThisEvent: (event: string) =>
    `Producer did not register event: ${event}`,
};
