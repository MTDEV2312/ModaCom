import { Sequelize } from "sequelize";
import { env } from "../config/env";

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL no esta definida");
}

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "mysql",
  logging: false,
});
