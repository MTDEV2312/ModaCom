import { ZodError, ZodTypeAny } from "zod";
import { sendApiError } from "./api-error";

function zodMessage(error: ZodError) {
  const first = error.issues[0];
  if (!first) {
    return "Datos inválidos";
  }

  const path = first.path.length > 0 ? `${first.path.join(".")}: ` : "";
  return `${path}${first.message}`;
}

function zodDetails(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

function validatePart(schema: ZodTypeAny, pick: (req: any) => unknown, assign: (req: any, value: unknown) => void) {
  return (req: any, res: any, next: any) => {
    const parsed = schema.safeParse(pick(req));
    if (!parsed.success) {
      return sendApiError(res, 400, "VALIDATION_ERROR", zodMessage(parsed.error), {
        details: zodDetails(parsed.error),
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
    req.query = value;
  });
}

export function validateParams(schema: ZodTypeAny) {
  return validatePart(schema, (req) => req.params, (req, value) => {
    req.params = value;
  });
}
