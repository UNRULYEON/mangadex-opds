export type ResponseEntity<T> = {
  result: string;
  response: 'entity';
  data: T;
};

export type ResponseCollection<T> = {
  result: string;
  response: 'collection';
  data: T;
  limit: number;
  offset: number;
  total: number;
};
