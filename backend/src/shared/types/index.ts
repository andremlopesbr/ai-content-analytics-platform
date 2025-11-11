export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface DateRange {
  from: Date;
  to: Date;
}

// Common validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface RequestContext {
  userId?: string;
  requestId: string;
  timestamp: Date;
}