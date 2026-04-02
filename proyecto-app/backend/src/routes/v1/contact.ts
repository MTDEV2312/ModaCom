import { Router } from "express";
import { ContactMessage } from "../../db/models";

export const contactV1Router = Router();

const asEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();

contactV1Router.post("/contact/messages", async (req: any, res: any) => {
  try {
    const { name, email, phone, subject, message } = req.body ?? {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Nombre, email, asunto y mensaje son requeridos",
      });
    }

    const normalizedEmail = asEmail(email);
    if (!normalizedEmail.includes("@")) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Email inválido",
      });
    }

    const created = await ContactMessage.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : null,
      subject: String(subject).trim(),
      message: String(message).trim(),
      status: "new",
    });

    return res.status(201).json({
      success: true,
      data: {
        id: String(created.id),
        name: created.name,
        email: created.email,
        phone: created.phone ?? undefined,
        subject: created.subject,
        message: created.message,
        status: created.status,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
      message: "Mensaje recibido correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error creando mensaje de contacto",
    });
  }
});
