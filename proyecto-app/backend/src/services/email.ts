import { Resend } from "resend";
import { env } from "../config/env";

type SendPasswordResetEmailInput = {
  to: string;
  resetToken: string;
};

function resolveFrontendResetUrl(token: string) {
  const base = env.frontendResetPasswordUrl.trim();
  const url = new URL(base);
  url.searchParams.set("token", token);
  return url.toString();
}

function resolveFromAddress() {
  if (env.resendFromEmail) {
    return env.resendFromEmail;
  }

  const domain = env.resendEmailDomain;
  if (domain) {
    return `ModaCom <noreply@${domain}>`;
  }

  return "ModaCom <onboarding@resend.dev>";
}

function getResendClient() {
  const apiKey = env.resendApiKey;
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

export function isEmailDeliveryConfigured() {
  return Boolean(env.resendApiKey);
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const client = getResendClient();
  if (!client) {
    return {
      delivered: false,
      reason: "missing-api-key",
    } as const;
  }

  const resetUrl = resolveFrontendResetUrl(input.resetToken);
  const from = resolveFromAddress();

  const sendResult = await client.emails.send(
    {
      from,
      to: [input.to],
      subject: "Restablece tu contraseña en ModaCom",
      html: `
        <h2>Restablece tu contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>
          <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">
            Haz clic aqui para restablecerla
          </a>
        </p>
        <p>Si no solicitaste este cambio, ignora este correo.</p>
        <p>Este enlace expira pronto por seguridad.</p>
      `,
      text: `Restablece tu contraseña: ${resetUrl}`,
    },
    {
      idempotencyKey: `password-reset/${input.to}/${input.resetToken.slice(0, 16)}`,
    },
  );

  const error =
    typeof sendResult === "object" && sendResult !== null && "error" in sendResult
      ? (sendResult as { error?: unknown }).error
      : undefined;

  if (error) {
    return {
      delivered: false,
      reason: "provider-error",
      providerError: error,
    } as const;
  }

  return {
    delivered: true,
  } as const;
}
