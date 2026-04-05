type Bucket = {
  count: number;
  windowStart: number;
};

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
};

function getClientKey(req: any) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function createRateLimit(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  return (req: any, res: any, next: any) => {
    const now = Date.now();
    const key = getClientKey(req);
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.windowStart >= options.windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      return next();
    }

    if (bucket.count >= options.max) {
      return res.status(429).json({
        success: false,
        data: null,
        message: options.message,
      });
    }

    bucket.count += 1;
    buckets.set(key, bucket);
    return next();
  };
}

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Demasiados intentos de autenticación. Intenta nuevamente en unos minutos.",
});

export const authRecoverRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Demasiadas solicitudes de recuperación. Intenta nuevamente en unos minutos.",
});

export const authResetRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Demasiados intentos de restablecimiento. Intenta nuevamente en unos minutos.",
});

export const contactRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Demasiados mensajes enviados. Intenta nuevamente en unos minutos.",
});
