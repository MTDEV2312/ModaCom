import { Router } from "express";
import { ContactMessage } from "../../db/models";
import { validateBody } from "../../middleware/validate";
import { contactCreateSchema } from "../../validation/schemas";

export const contactV1Router = Router();

const asEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();

contactV1Router.post("/contact/messages", validateBody(contactCreateSchema), async (req: any, res: any) => {
  try {
    const { name, email, phone, subject, message } = req.body ?? {};
    const normalizedEmail = asEmail(email);

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
