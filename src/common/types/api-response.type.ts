export interface ApiSuccessResponse<T> {
  statusCode: number;
  timestamp: string;
  data: T;
}

export interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
}
