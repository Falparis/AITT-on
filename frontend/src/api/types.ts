// Shared shapes for the backend envelope + a normalized error type.
// The backend wraps every response as { success, data, message? } and puts
// list pagination as a SIBLING of data (not nested).

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
}

export interface Paginated<T> {
  data: T;
  pagination?: Pagination;
}

/** Normalized error thrown by every client call. UI can read `.status`/`.message`. */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}
