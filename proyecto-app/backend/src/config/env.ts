import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.BACKEND_PORT ?? 5000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  frontendResetPasswordUrl:
    process.env.FRONTEND_RESET_PASSWORD_URL ?? `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/recuperar-password`,
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-jwt-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "14d",
  passwordResetTokenExpiresIn: process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN ?? "1h",
  resendApiKey: process.env.RESEND_API_KEY ?? process.env.EMAIL_API_KEY ?? process.env.API_KEY ?? "",
  resendEmailDomain: process.env.RESEND_EMAIL_DOMAIN ?? process.env.EMAIL_DOMAIN ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "",
};
