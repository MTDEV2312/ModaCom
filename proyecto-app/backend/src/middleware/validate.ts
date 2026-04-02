import type { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";

function zodMessage(error: ZodError) {
  const first = error.issues[0];
  if (!first) {
    return "Datos inválidos";
  }

  const path = first.path.length > 0 ? `${first.path.join(".")}: ` : "";
  return `${path}${first.message}`;
}

function validatePart(schema: ZodTypeAny, pick: (req: Request) => unknown, assign: (req: Request, value: unknown) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(pick(req));
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        data: null,
        message: zodMessage(parsed.error),
      });
    }

    assign(req, parsed.data);
    return next();
  };
}

export function validateBody(schema: ZodTypeAny) {
  return validatePart(schema, (req) => req.body, (req, value) => {
    req.body = value;
  });
}

export function validateQuery(schema: ZodTypeAny) {
  return validatePart(schema, (req) => req.query, (req, value) => {
    req.query = value as Request["query"];
  });
}

export function validateParams(schema: ZodTypeAny) {
  return validatePart(schema, (req) => req.params, (req, value) => {
    req.params = value as Request["params"];
  });
}
