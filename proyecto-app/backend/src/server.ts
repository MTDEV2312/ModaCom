import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import type { Request, Response } from "express";
import { env } from "./config/env";
import { bootstrapDatabase } from "./db/bootstrap";
import { initModelAssociations } from "./db/models";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { authRateLimit, authRecoverRateLimit, authResetRateLimit, contactRateLimit } from "./middleware/rate-limit";
import { healthRouter } from "./routes/health";
import { v1Router } from "./routes/v1";

initModelAssociations();

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
  }),
);
app.use(morgan("dev"));
app.use(express.json());

const docsDir = path.join(__dirname, "..", "docs");
const swaggerUiDir = path.dirname(require.resolve("swagger-ui-dist/swagger-ui.css"));

app.use("/api/swagger-ui", express.static(swaggerUiDir));
app.use("/api/docs-assets", express.static(docsDir));

app.use("/api/v1/auth/recover-password", authRecoverRateLimit);
app.use("/api/v1/auth/reset-password", authResetRateLimit);
app.use("/api/v1/auth", authRateLimit);
app.use("/api/v1/contact/messages", contactRateLimit);

app.get("/api/openapi.json", (_req: Request, res: Response) => {
  (res as any).sendFile(path.join(docsDir, "openapi.json"));
});

app.get("/api/docs", (_req: Request, res: Response) => {
  (res as any).sendFile(path.join(docsDir, "api-interactive.html"));
});

app.use("/api", healthRouter);
app.use("/api/v1", v1Router);
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await bootstrapDatabase();

    app.listen(env.port, "0.0.0.0", () => {
      console.log(`Backend running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start backend", error);
    process.exit(1);
  }
}

if (require.main === module) {
  void startServer();
}

export { startServer };
