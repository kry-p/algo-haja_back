import bs from 'binary-search';

const binarySearch = (target, array) =>
  bs(array, target, (element, needle) => element - needle);

export default binarySearch;
