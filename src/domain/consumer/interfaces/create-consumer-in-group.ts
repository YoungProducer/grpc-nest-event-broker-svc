export interface CreateConsumerInGroupPayload {
  // basicaly that's a producer's id
  streamKey: string;
  // basicaly that's an event name
  groupName: string;
  consumerId: string;
}
