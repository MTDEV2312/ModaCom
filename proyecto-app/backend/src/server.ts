import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { healthRouter } from "./routes/health";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
  }),
);
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", healthRouter);

app.listen(env.port, "0.0.0.0", () => {
  console.log(`Backend running on port ${env.port}`);
});
