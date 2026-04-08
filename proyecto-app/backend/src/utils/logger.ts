type ErrorContext = Record<string, unknown>;

function safeMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function logTechnicalError(scope: string, error: unknown, context?: ErrorContext) {
  console.error(`[backend][${scope}]`, {
    message: safeMessage(error),
    ...(context ? { context } : {}),
  });
}