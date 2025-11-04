type PaginatedListResponse<T> = {
  data: T[];
  count: number;
  offset: number;
  limit: number;
};
