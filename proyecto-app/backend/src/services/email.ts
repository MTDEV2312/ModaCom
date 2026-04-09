import { Resend } from "resend";
import { env } from "../config/env";

type SendPasswordResetEmailInput = {
  to: string;
  resetToken: string;
};

type SendEmailPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
};

type SendEmailOptions = {
  idempotencyKey: string;
};

type SendEmailTransport = (payload: SendEmailPayload, options: SendEmailOptions) => Promise<unknown>;

let sendEmailTransportOverride: SendEmailTransport | null = null;

function resolveFrontendResetUrl(token: string) {
  const base = env.frontendResetPasswordUrl.trim();
  const url = new URL(base);
  if (url.pathname.endsWith("/recuperar-password")) {
    url.pathname = url.pathname.replace(/\/recuperar-password$/, "/reset-password");
  }
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

function extractProviderMessageId(sendResult: unknown) {
  if (typeof sendResult !== "object" || sendResult === null || !("id" in sendResult)) {
    return undefined;
  }

  const id = (sendResult as { id?: unknown }).id;
  return typeof id === "string" && id.trim() ? id : undefined;
}

function extractProviderError(sendResult: unknown) {
  if (typeof sendResult !== "object" || sendResult === null || !("error" in sendResult)) {
    return undefined;
  }

  return (sendResult as { error?: unknown }).error;
}

export function setEmailSenderForTests(sender: SendEmailTransport | null) {
  sendEmailTransportOverride = sender;
}

export function isEmailDeliveryConfigured() {
  return Boolean(env.resendApiKey);
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const resetUrl = resolveFrontendResetUrl(input.resetToken);
  const from = resolveFromAddress();
  const payload: SendEmailPayload = {
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
  };
  const options: SendEmailOptions = {
    idempotencyKey: `password-reset/${input.to}/${input.resetToken.slice(0, 16)}`,
  };

  let sendResult: unknown;

  if (sendEmailTransportOverride) {
    sendResult = await sendEmailTransportOverride(payload, options);
  } else {
    const client = getResendClient();
    if (!client) {
      return {
        delivered: false,
        reason: "missing-api-key",
      } as const;
    }

    sendResult = await client.emails.send(payload, options);
  }

  const error = extractProviderError(sendResult);
  const providerMessageId = extractProviderMessageId(sendResult);

  if (error) {
    return {
      delivered: false,
      reason: "provider-error",
      providerError: error,
      providerMessageId,
    } as const;
  }

  return {
    delivered: true,
    providerMessageId,
  } as const;
}
