type ApiErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "AUTH_REQUIRED"
  | "AUTH_INVALID"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "BUSINESS_RULE"
  | "INTERNAL_ERROR";

type ApiErrorOptions = {
  details?: unknown;
};

export function sendApiError(
  res: any,
  status: number,
  code: ApiErrorCode,
  message: string,
  options?: ApiErrorOptions,
) {
  return res.status(status).json({
    success: false,
    data: null,
    message,
    error: {
      code,
      status,
      ...(options?.details !== undefined ? { details: options.details } : {}),
    },
  });
}