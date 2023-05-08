export const consumerServiceErrorMsgs = {
  notRegistered: (id: string) => `Consumer with id: ${id} is not registered`,
  eventNotRegistered: (id: string, event: string) =>
    `Consumer with id: ${id} cannot consume event: ${event}`,
  alreadyRegistered: (name: string) =>
    `Consumer with name: ${name} already registered`,
};
