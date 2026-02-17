/**
 * API Response Helpers
 * Standardized response utilities for CNEBL API routes
 */

import { NextResponse } from 'next/server';
import type {
  ApiResponse,
  ApiErrorResponse,
  PaginatedResponse,
  ApiErrorCode,
} from '@/types';

// =============================================================================
// SUCCESS RESPONSES
// =============================================================================

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Create a successful paginated API response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
  },
  status = 200
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(pagination.totalItems / pagination.pageSize);

  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems: pagination.totalItems,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1,
      },
    },
    { status }
  );
}

/**
 * Create a 201 Created response
 */
export function createdResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return successResponse(data, 201);
}

/**
 * Create a 204 No Content response
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// =============================================================================
// ERROR RESPONSES
// =============================================================================

/**
 * Create an error API response
 */
export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status = 500,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

/**
 * 400 Bad Request
 */
export function badRequestResponse(
  message = 'Bad request',
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return errorResponse('BAD_REQUEST', message, 400, details);
}

/**
 * 401 Unauthorized
 */
export function unauthorizedResponse(
  message = 'Authentication required'
): NextResponse<ApiErrorResponse> {
  return errorResponse('UNAUTHORIZED', message, 401);
}

/**
 * 403 Forbidden
 */
export function forbiddenResponse(
  message = 'Access denied'
): NextResponse<ApiErrorResponse> {
  return errorResponse('FORBIDDEN', message, 403);
}

/**
 * 404 Not Found
 */
export function notFoundResponse(
  resource = 'Resource',
  id?: string
): NextResponse<ApiErrorResponse> {
  const message = id
    ? `${resource} with ID '${id}' not found`
    : `${resource} not found`;
  return errorResponse('NOT_FOUND', message, 404);
}

/**
 * 422 Validation Error
 */
export function validationErrorResponse(
  errors: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return errorResponse('VALIDATION_ERROR', 'Validation failed', 422, { errors });
}

/**
 * 500 Internal Server Error
 */
export function internalErrorResponse(
  message = 'An internal server error occurred'
): NextResponse<ApiErrorResponse> {
  return errorResponse('INTERNAL_ERROR', message, 500);
}

/**
 * Database error response
 */
export function databaseErrorResponse(
  message = 'Database error occurred'
): NextResponse<ApiErrorResponse> {
  return errorResponse('DATABASE_ERROR', message, 503);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10))
  );
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

/**
 * Parse sort parameters from URL search params
 */
export function parseSortParams<T extends string>(
  searchParams: URLSearchParams,
  allowedFields: T[],
  defaultField: T
): { sortBy: T; sortDir: 'asc' | 'desc' } {
  const sortBy = searchParams.get('sortBy') as T;
  const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';

  return {
    sortBy: allowedFields.includes(sortBy) ? sortBy : defaultField,
    sortDir,
  };
}

/**
 * Safely parse a date string from URL search params
 */
export function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse an array parameter (can be single value or comma-separated)
 */
export function parseArrayParam(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

/**
 * Parse a boolean parameter
 */
export function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}
