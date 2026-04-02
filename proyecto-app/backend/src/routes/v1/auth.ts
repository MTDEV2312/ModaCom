import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Router } from "express";
import { Op } from "sequelize";
import { User } from "../../db/models/User";
import { Address } from "../../db/models/Address";
import { RefreshToken } from "../../db/models/RefreshToken";
import { requireAuth, signAccessToken, signRefreshToken, verifyRefreshToken } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import {
  authLoginSchema,
  authLogoutSchema,
  authRecoverSchema,
  authRefreshSchema,
  authRegisterSchema,
  authResetSchema,
} from "../../validation/schemas";

export const authV1Router = Router();

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function refreshExpiryDate() {
  const raw = String(process.env.JWT_REFRESH_EXPIRES_IN ?? "14d").trim();
  const match = raw.match(/^(\d+)([dDhH])$/);
  if (!match) {
    return new Date(Date.now() + 14 * ONE_DAY_MS);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const ttl = unit === "h" ? amount * 60 * 60 * 1000 : amount * ONE_DAY_MS;
  return new Date(Date.now() + ttl);
}

async function issueSessionTokens(user: User) {
  const tokenId = crypto.randomUUID().replace(/-/g, "");

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    userId: user.id,
    tokenId,
  });

  await RefreshToken.create({
    id: tokenId,
    userId: user.id,
    token: refreshToken,
    expiresAt: refreshExpiryDate(),
  });

  return { accessToken, refreshToken };
}

authV1Router.post("/auth/register", validateBody(authRegisterSchema), async (req: any, res: any) => {
  try {
    const { email, password, confirmPassword, firstName, lastName, acceptTerms } = req.body ?? {};

    const existing = await User.findOne({ where: { email: String(email).toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, data: null, message: "El email ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      email: String(email).toLowerCase(),
      passwordHash,
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      role: "customer",
    });

    return res.status(201).json({
      success: true,
      data: {
        id: String(user.id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      message: "Cuenta creada exitosamente",
    });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error instanceof Error ? error.message : "Error al registrar" });
  }
});

authV1Router.post("/auth/login", validateBody(authLoginSchema), async (req: any, res: any) => {
  try {
    const { email, password } = req.body ?? {};

    const user = await User.findOne({ where: { email: String(email).toLowerCase() } });
    if (!user) {
      return res.status(401).json({ success: false, data: null, message: "Credenciales inválidas" });
    }

    const isValid = await bcrypt.compare(String(password), user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, data: null, message: "Credenciales inválidas" });
    }

    const { accessToken, refreshToken } = await issueSessionTokens(user);

    return res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: String(user.id),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      },
      message: "Inicio de sesión exitoso",
    });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error instanceof Error ? error.message : "Error al iniciar sesión" });
  }
});

authV1Router.get("/auth/me", requireAuth, async (req: any, res: any) => {
  try {
    const user = await User.findByPk(req.auth.userId, {
      include: [{ model: Address, as: "addresses" }],
    });
    if (!user) {
      return res.status(404).json({ success: false, data: null, message: "Usuario no encontrado" });
    }

    const addresses = ((user.get("addresses") as Address[] | undefined) ?? []).map((address) => ({
      id: String(address.id),
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    }));

    return res.status(200).json({
      success: true,
      data: {
        id: String(user.id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        addresses,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error instanceof Error ? error.message : "Error obteniendo usuario" });
  }
});

authV1Router.post("/auth/recover-password", validateBody(authRecoverSchema), async (req: any, res: any) => {
  const { email } = req.body ?? {};

  return res.status(200).json({
    success: true,
    data: null,
    message: "Si la cuenta existe, enviaremos un enlace de recuperación",
  });
});

authV1Router.post("/auth/refresh", validateBody(authRefreshSchema), async (req: any, res: any) => {
  try {
    const refreshToken = String(req.body?.refreshToken ?? "").trim();
    const payload = verifyRefreshToken(refreshToken);

    const stored = await RefreshToken.findOne({
      where: {
        id: payload.tokenId,
        userId: payload.userId,
        token: refreshToken,
        revokedAt: null,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!stored) {
      return res.status(401).json({ success: false, data: null, message: "Refresh token inválido" });
    }

    const user = await User.findByPk(payload.userId);
    if (!user) {
      return res.status(401).json({ success: false, data: null, message: "Usuario no encontrado" });
    }

    await stored.update({ revokedAt: new Date() });
    const next = await issueSessionTokens(user);

    return res.status(200).json({
      success: true,
      data: {
        token: next.accessToken,
        refreshToken: next.refreshToken,
      },
      message: "Token renovado",
    });
  } catch (_error) {
    return res.status(401).json({ success: false, data: null, message: "Refresh token inválido o expirado" });
  }
});

authV1Router.post("/auth/logout", validateBody(authLogoutSchema), async (req: any, res: any) => {
  try {
    const refreshToken = String(req.body?.refreshToken ?? "").trim();
    if (!refreshToken) {
      return res.status(200).json({ success: true, data: null, message: "Sesión cerrada" });
    }

    await RefreshToken.update(
      { revokedAt: new Date() },
      {
        where: {
          token: refreshToken,
          revokedAt: null,
        },
      },
    );

    return res.status(200).json({ success: true, data: null, message: "Sesión cerrada" });
  } catch (_error) {
    return res.status(200).json({ success: true, data: null, message: "Sesión cerrada" });
  }
});

authV1Router.post("/auth/reset-password", validateBody(authResetSchema), async (req: any, res: any) => {
  try {
    const { email, password, confirmPassword } = req.body ?? {};

    const user = await User.findOne({ where: { email: String(email).toLowerCase() } });
    if (!user) {
      return res.status(200).json({ success: true, data: null, message: "Si la cuenta existe, se actualizó la contraseña" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    await user.update({ passwordHash });

    await RefreshToken.update(
      { revokedAt: new Date() },
      {
        where: {
          userId: user.id,
          revokedAt: null,
        },
      },
    );

    return res.status(200).json({ success: true, data: null, message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error instanceof Error ? error.message : "Error al restablecer contraseña" });
  }
});
