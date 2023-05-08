export const producerServiceErrorMsgs = {
  notRegistered: (id: string, isId: boolean) =>
    `Producer with ${isId ? 'id' : 'name'}: ${id} is not registered!`,
  cannotProduceThisEvent: (event: string) =>
    `Producer did not register event: ${event}`,
  alreadyRegistered: (name: string) =>
    `Producer with name: ${name} already exist`
};
