import { Router } from "express";
import { sequelize } from "../db/sequelize";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
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
