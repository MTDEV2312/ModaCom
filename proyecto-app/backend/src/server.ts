import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { bootstrapDatabase } from "./db/bootstrap";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { authRateLimit, contactRateLimit } from "./middleware/rate-limit";
import { healthRouter } from "./routes/health";
import { v1Router } from "./routes/v1";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
  }),
);
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1/auth", authRateLimit);
app.use("/api/v1/contact/messages", contactRateLimit);

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

void startServer();
