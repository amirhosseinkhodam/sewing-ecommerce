export interface ApiErrorResponse {
  readonly statusCode: number;
  readonly message: string | string[];
  readonly error: string;
}
