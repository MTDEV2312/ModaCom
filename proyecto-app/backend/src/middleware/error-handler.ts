export function notFoundHandler(req: any, res: any) {
  return res.status(404).json({
    success: false,
    data: null,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err: any, _req: any, res: any, _next: any) {
  const status = Number.isFinite(err?.statusCode) ? Number(err.statusCode) : 500;
  const message = err instanceof Error ? err.message : "Error interno del servidor";

  return res.status(status).json({
    success: false,
    data: null,
    message,
  });
}
