import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthPayload {
  userId: number;
  role: "customer" | "admin";
  email: string;
}

export function signAuthToken(payload: AuthPayload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function requireAuth(req: any, res: any, next: any) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Token requerido",
    });
  }

  const token = authorization.replace("Bearer ", "").trim();

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.auth = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Token inválido o expirado",
    });
  }
}

export function requireAdmin(req: any, res: any, next: any) {
  if (!req.auth) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Sesión no autenticada",
    });
  }

  if (req.auth.role !== "admin") {
    return res.status(403).json({
      success: false,
      data: null,
      message: "Acceso solo para administradores",
    });
  }

  return next();
}
