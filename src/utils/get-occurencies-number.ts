export const getOccurenciesNumber = (
  input: string,
  searchFor: string,
): number => {
  const re = new RegExp(searchFor, 'g');

  return (input.match(re) || []).length;
};
