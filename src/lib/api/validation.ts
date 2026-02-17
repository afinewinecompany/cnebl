/**
 * API Request Validation Utilities
 * Simple validation helpers for CNEBL API routes
 */

// =============================================================================
// VALIDATION RESULT TYPE
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Create a successful validation result
 */
export function validResult(): ValidationResult {
  return { valid: true, errors: {} };
}

/**
 * Create a failed validation result with errors
 */
export function invalidResult(errors: Record<string, string[]>): ValidationResult {
  return { valid: false, errors };
}

/**
 * Add an error to a validation result
 */
export function addError(
  result: ValidationResult,
  field: string,
  message: string
): ValidationResult {
  return {
    valid: false,
    errors: {
      ...result.errors,
      [field]: [...(result.errors[field] || []), message],
    },
  };
}

/**
 * Merge multiple validation results
 */
export function mergeResults(...results: ValidationResult[]): ValidationResult {
  const mergedErrors: Record<string, string[]> = {};
  let valid = true;

  for (const result of results) {
    if (!result.valid) {
      valid = false;
      for (const [field, messages] of Object.entries(result.errors)) {
        mergedErrors[field] = [...(mergedErrors[field] || []), ...messages];
      }
    }
  }

  return { valid, errors: mergedErrors };
}

// =============================================================================
// FIELD VALIDATORS
// =============================================================================

/**
 * Validate a required string field
 */
export function validateRequired(
  value: unknown,
  fieldName: string
): ValidationResult {
  if (value === undefined || value === null || value === '') {
    return invalidResult({ [fieldName]: [`${fieldName} is required`] });
  }
  return validResult();
}

/**
 * Validate a string field's length
 */
export function validateLength(
  value: string | undefined | null,
  fieldName: string,
  options: { min?: number; max?: number }
): ValidationResult {
  if (value === undefined || value === null) {
    return validResult();
  }

  const errors: string[] = [];

  if (options.min !== undefined && value.length < options.min) {
    errors.push(`${fieldName} must be at least ${options.min} characters`);
  }

  if (options.max !== undefined && value.length > options.max) {
    errors.push(`${fieldName} must be at most ${options.max} characters`);
  }

  return errors.length > 0 ? invalidResult({ [fieldName]: errors }) : validResult();
}

/**
 * Validate a UUID format
 */
export function validateUUID(
  value: string | undefined | null,
  fieldName: string
): ValidationResult {
  if (value === undefined || value === null) {
    return validResult();
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    return invalidResult({ [fieldName]: [`${fieldName} must be a valid UUID`] });
  }

  return validResult();
}

/**
 * Validate an email format
 */
export function validateEmail(
  value: string | undefined | null,
  fieldName: string
): ValidationResult {
  if (value === undefined || value === null) {
    return validResult();
  }

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  if (!emailRegex.test(value)) {
    return invalidResult({ [fieldName]: [`${fieldName} must be a valid email address`] });
  }

  return validResult();
}

/**
 * Validate a number is within a range
 */
export function validateRange(
  value: number | undefined | null,
  fieldName: string,
  options: { min?: number; max?: number }
): ValidationResult {
  if (value === undefined || value === null) {
    return validResult();
  }

  const errors: string[] = [];

  if (options.min !== undefined && value < options.min) {
    errors.push(`${fieldName} must be at least ${options.min}`);
  }

  if (options.max !== undefined && value > options.max) {
    errors.push(`${fieldName} must be at most ${options.max}`);
  }

  return errors.length > 0 ? invalidResult({ [fieldName]: errors }) : validResult();
}

/**
 * Validate a value is one of allowed values
 */
export function validateEnum<T extends string>(
  value: string | undefined | null,
  fieldName: string,
  allowedValues: readonly T[]
): ValidationResult {
  if (value === undefined || value === null) {
    return validResult();
  }

  if (!allowedValues.includes(value as T)) {
    return invalidResult({
      [fieldName]: [`${fieldName} must be one of: ${allowedValues.join(', ')}`],
    });
  }

  return validResult();
}

/**
 * Validate a date string (ISO format)
 */
export function validateDate(
  value: string | undefined | null,
  fieldName: string
): ValidationResult {
  if (value === undefined || value === null) {
    return validResult();
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return invalidResult({ [fieldName]: [`${fieldName} must be a valid date`] });
  }

  return validResult();
}

/**
 * Validate a date range (start must be before end)
 */
export function validateDateRange(
  startDate: string | undefined | null,
  endDate: string | undefined | null,
  startFieldName: string,
  endFieldName: string
): ValidationResult {
  if (!startDate || !endDate) {
    return validResult();
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return invalidResult({
      [startFieldName]: [`${startFieldName} must be before ${endFieldName}`],
    });
  }

  return validResult();
}

// =============================================================================
// COMPOSITE VALIDATORS
// =============================================================================

/**
 * Validate team ID parameter
 */
export function validateTeamId(teamId: string | undefined | null): ValidationResult {
  const results = [
    validateRequired(teamId, 'teamId'),
  ];

  // For now, accept simple string IDs (mock data uses slugs like "seadogs")
  // When using real database, switch to UUID validation:
  // if (teamId) results.push(validateUUID(teamId, 'teamId'));

  return mergeResults(...results);
}

/**
 * Validate game ID parameter
 */
export function validateGameId(gameId: string | undefined | null): ValidationResult {
  const results = [
    validateRequired(gameId, 'gameId'),
  ];

  // For now, accept simple string IDs (mock data uses slugs like "game-001")
  // When using real database, switch to UUID validation:
  // if (gameId) results.push(validateUUID(gameId, 'gameId'));

  return mergeResults(...results);
}

/**
 * Validate season ID parameter
 */
export function validateSeasonId(seasonId: string | undefined | null): ValidationResult {
  if (!seasonId) return validResult();

  // For now, accept simple string IDs
  // When using real database, switch to UUID validation:
  // return validateUUID(seasonId, 'seasonId');

  return validResult();
}

/**
 * Validate games query parameters
 */
export function validateGamesQueryParams(params: {
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
}): ValidationResult {
  const results: ValidationResult[] = [];

  if (params.startDate) {
    results.push(validateDate(params.startDate, 'startDate'));
  }

  if (params.endDate) {
    results.push(validateDate(params.endDate, 'endDate'));
  }

  if (params.startDate && params.endDate) {
    results.push(validateDateRange(params.startDate, params.endDate, 'startDate', 'endDate'));
  }

  if (params.status) {
    const validStatuses = ['scheduled', 'warmup', 'in_progress', 'final', 'postponed', 'cancelled', 'suspended'];
    const statuses = params.status.split(',');
    for (const status of statuses) {
      results.push(validateEnum(status.trim(), 'status', validStatuses));
    }
  }

  return mergeResults(...results);
}

/**
 * Validate stats query parameters
 */
export function validateStatsQueryParams(params: {
  minAtBats?: number;
  minInningsPitched?: number;
}): ValidationResult {
  const results: ValidationResult[] = [];

  if (params.minAtBats !== undefined) {
    results.push(validateRange(params.minAtBats, 'minAtBats', { min: 0, max: 1000 }));
  }

  if (params.minInningsPitched !== undefined) {
    results.push(validateRange(params.minInningsPitched, 'minInningsPitched', { min: 0, max: 500 }));
  }

  return mergeResults(...results);
}
