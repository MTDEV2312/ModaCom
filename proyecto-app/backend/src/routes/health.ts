import { Router } from "express";
import type { Request, Response } from "express";
import { sequelize } from "../db/sequelize";

export const healthRouter = Router();

healthRouter.get("/health", async (_req: Request, res: any) => {
  try {
    await sequelize.authenticate();
    return res.status(200).json({
      status: "ok",
      service: "backend",
      database: "connected",
    });
  } catch (_error) {
    return res.status(500).json({
      status: "error",
      service: "backend",
      database: "disconnected",
    });
  }
});
