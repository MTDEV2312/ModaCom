import { sendApiError } from "./api-error";

export function notFoundHandler(req: any, res: any) {
  return sendApiError(res, 404, "NOT_FOUND", `Ruta no encontrada: ${req.method} ${req.originalUrl}`);
}

export function errorHandler(err: any, _req: any, res: any, _next: any) {
  const status = Number.isFinite(err?.statusCode) ? Number(err.statusCode) : 500;
  const message = err instanceof Error ? err.message : "Error interno del servidor";
  const code = status >= 500 ? "INTERNAL_ERROR" : "BUSINESS_RULE";

  return sendApiError(res, status, code, message);
}
