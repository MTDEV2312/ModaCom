import bcrypt from "bcryptjs";
import { Router } from "express";
import { User } from "../../db/models/User";
import { requireAuth, signAuthToken } from "../../middleware/auth";

export const authV1Router = Router();

authV1Router.post("/auth/register", async (req: any, res: any) => {
  try {
    const { email, password, confirmPassword, firstName, lastName, acceptTerms } = req.body ?? {};

    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      return res.status(400).json({ success: false, data: null, message: "Faltan campos requeridos" });
    }

    if (!String(email).includes("@")) {
      return res.status(400).json({ success: false, data: null, message: "Email inválido" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ success: false, data: null, message: "La contraseña debe tener al menos 8 caracteres" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, data: null, message: "Las contraseñas no coinciden" });
    }

    if (!acceptTerms) {
      return res.status(400).json({ success: false, data: null, message: "Debes aceptar los términos" });
    }

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

authV1Router.post("/auth/login", async (req: any, res: any) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ success: false, data: null, message: "Email y contraseña requeridos" });
    }

    const user = await User.findOne({ where: { email: String(email).toLowerCase() } });
    if (!user) {
      return res.status(401).json({ success: false, data: null, message: "Credenciales inválidas" });
    }

    const isValid = await bcrypt.compare(String(password), user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, data: null, message: "Credenciales inválidas" });
    }

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      data: {
        token,
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
    const user = await User.findByPk(req.auth.userId);
    if (!user) {
      return res.status(404).json({ success: false, data: null, message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: String(user.id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error instanceof Error ? error.message : "Error obteniendo usuario" });
  }
});

authV1Router.post("/auth/recover-password", async (req: any, res: any) => {
  const { email } = req.body ?? {};
  if (!email || !String(email).includes("@")) {
    return res.status(400).json({ success: false, data: null, message: "Email inválido" });
  }

  return res.status(200).json({
    success: true,
    data: null,
    message: "Si la cuenta existe, enviaremos un enlace de recuperación",
  });
});
