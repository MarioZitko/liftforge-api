export interface PaginatedRequest {
  pageNumber: number;
  pageSize: number;
  searchText?: string;
  orderByProperty?: string;
  ascending?: boolean;
  filters?: Record<string, string>; // Additional filters
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
