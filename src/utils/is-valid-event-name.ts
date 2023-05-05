export const bannedEventNameSymbols = [' '];

export const isValidEventName = (name: string) => {
  return !bannedEventNameSymbols.some((symbol) => name.includes(symbol));
};
