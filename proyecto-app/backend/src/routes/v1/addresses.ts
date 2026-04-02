import { Router } from "express";
import { Op } from "sequelize";
import { Address } from "../../db/models";
import { requireAuth } from "../../middleware/auth";
import { validateBody, validateParams } from "../../middleware/validate";
import { addressCreateSchema, addressIdParamSchema, addressUpdateSchema } from "../../validation/schemas";

export const addressesV1Router = Router();

type AddressResponse = {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

function mapAddress(address: Address): AddressResponse {
  return {
    id: String(address.id),
    street: address.street,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
}

async function ensureSingleDefault(userId: number, defaultAddressId: number) {
  await Address.update(
    { isDefault: false },
    {
      where: {
        userId,
        id: { [Op.ne]: defaultAddressId },
      },
    },
  );
}

addressesV1Router.get("/addresses", requireAuth, async (req: any, res: any) => {
  try {
    const userId = Number(req.auth.userId);
    const rows = await Address.findAll({ where: { userId }, order: [["isDefault", "DESC"], ["createdAt", "DESC"]] });

    return res.status(200).json({ success: true, data: rows.map(mapAddress) });
  } catch (error) {
    return res.status(500).json({ success: false, data: [], message: error instanceof Error ? error.message : "Error listando direcciones" });
  }
});

addressesV1Router.post("/addresses", requireAuth, validateBody(addressCreateSchema), async (req: any, res: any) => {
  try {
    const userId = Number(req.auth.userId);
    const payload = req.body ?? {};

    const hasAny = await Address.count({ where: { userId } });
    const isDefault = payload.isDefault === true || hasAny === 0;

    const address = await Address.create({
      userId,
      street: String(payload.street).trim(),
      city: String(payload.city).trim(),
      state: String(payload.state).trim(),
      postalCode: String(payload.postalCode).trim(),
      country: String(payload.country).trim(),
      isDefault,
    });

    if (isDefault) {
      await ensureSingleDefault(userId, address.id);
    }

    return res.status(201).json({ success: true, data: mapAddress(address), message: "Dirección creada exitosamente" });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error instanceof Error ? error.message : "Error creando dirección" });
  }
});

addressesV1Router.patch("/addresses/:id", requireAuth, validateParams(addressIdParamSchema), validateBody(addressUpdateSchema), async (req: any, res: any) => {
  try {
    const userId = Number(req.auth.userId);
    const id = Number(req.params.id);
    const address = await Address.findOne({ where: { id, userId } });

    if (!address) {
      return res.status(404).json({ success: false, data: null, message: "Dirección no encontrada" });
    }

    const payload = req.body ?? {};
    await address.update({
      ...(payload.street !== undefined ? { street: String(payload.street).trim() } : {}),
      ...(payload.city !== undefined ? { city: String(payload.city).trim() } : {}),
      ...(payload.state !== undefined ? { state: String(payload.state).trim() } : {}),
      ...(payload.postalCode !== undefined ? { postalCode: String(payload.postalCode).trim() } : {}),
      ...(payload.country !== undefined ? { country: String(payload.country).trim() } : {}),
      ...(payload.isDefault !== undefined ? { isDefault: Boolean(payload.isDefault) } : {}),
    });

    if (payload.isDefault === true) {
      await ensureSingleDefault(userId, address.id);
    }

    return res.status(200).json({ success: true, data: mapAddress(address), message: "Dirección actualizada exitosamente" });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error instanceof Error ? error.message : "Error actualizando dirección" });
  }
});

addressesV1Router.patch("/addresses/:id/default", requireAuth, validateParams(addressIdParamSchema), async (req: any, res: any) => {
  try {
    const userId = Number(req.auth.userId);
    const id = Number(req.params.id);
    const address = await Address.findOne({ where: { id, userId } });

    if (!address) {
      return res.status(404).json({ success: false, data: null, message: "Dirección no encontrada" });
    }

    await Address.update({ isDefault: false }, { where: { userId } });
    await address.update({ isDefault: true });

    return res.status(200).json({ success: true, data: mapAddress(address), message: "Dirección principal actualizada" });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error instanceof Error ? error.message : "Error actualizando dirección principal" });
  }
});

addressesV1Router.delete("/addresses/:id", requireAuth, validateParams(addressIdParamSchema), async (req: any, res: any) => {
  try {
    const userId = Number(req.auth.userId);
    const id = Number(req.params.id);
    const address = await Address.findOne({ where: { id, userId } });

    if (!address) {
      return res.status(404).json({ success: false, data: null, message: "Dirección no encontrada" });
    }

    const wasDefault = address.isDefault;
    await address.destroy();

    if (wasDefault) {
      const nextDefault = await Address.findOne({ where: { userId }, order: [["createdAt", "DESC"]] });
      if (nextDefault) {
        await nextDefault.update({ isDefault: true });
      }
    }

    return res.status(200).json({ success: true, data: null, message: "Dirección eliminada exitosamente" });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error instanceof Error ? error.message : "Error eliminando dirección" });
  }
});
