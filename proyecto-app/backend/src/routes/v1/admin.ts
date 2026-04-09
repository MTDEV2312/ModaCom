import { Router } from "express";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  Address,
  Category,
  ContactMessage,
  Offer,
  OfferCategory,
  Order,
  OrderItem,
  PasswordResetToken,
  Product,
  ProductColor,
  ProductImage,
  ProductSize,
  ProductVariant,
  User,
} from "../../db/models";
import { requireAdmin, requireAuth } from "../../middleware/auth";
import { validateBody, validateParams } from "../../middleware/validate";
import { adminContactStatusSchema, adminOrderStatusSchema, adminStatusIdParamSchema } from "../../validation/schemas";

export const adminV1Router = Router();

const VALID_CATEGORY_SLUGS = ["hombre", "mujer", "ninos"] as const;

function parsePagination(query: any) {
  const page = Math.max(1, Number(query?.page ?? 1));
  const pageSize = Math.max(1, Math.min(100, Number(query?.pageSize ?? 20)));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function buildPagination(page: number, pageSize: number, totalItems: number) {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}

function isCategorySlug(value: string): value is (typeof VALID_CATEGORY_SLUGS)[number] {
  return VALID_CATEGORY_SLUGS.includes(value as (typeof VALID_CATEGORY_SLUGS)[number]);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function sanitizeImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function resolveUploadPublicBase(req: any) {
  return `${req.protocol}://${req.get("host")}`;
}

async function writeUploadedImageFromBase64(params: {
  data: string;
  originalName?: string;
  contentType?: string;
}) {
  const dataUrlMatch = params.data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  const mimeType = dataUrlMatch ? dataUrlMatch[1] : params.contentType;
  const base64Payload = dataUrlMatch ? dataUrlMatch[2] : params.data;

  if (!mimeType || !/^image\/(jpeg|jpg|png|webp|gif)$/.test(mimeType)) {
    throw new Error("Tipo de imagen no soportado");
  }

  const normalizedBase64 = String(base64Payload).trim();
  if (!normalizedBase64) {
    throw new Error("Imagen vacia");
  }

  const bytes = Buffer.from(normalizedBase64, "base64");
  const maxBytes = 5 * 1024 * 1024;
  if (bytes.length === 0 || bytes.length > maxBytes) {
    throw new Error("La imagen excede 5MB o no es valida");
  }

  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  const extension = extensionMap[mimeType] ?? "jpg";
  const safeOriginal = (params.originalName ?? "image")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/\.+/g, ".")
    .replace(/^-+|-+$/g, "");
  const baseName = safeOriginal.replace(/\.[a-z0-9]+$/i, "") || "image";
  const fileName = `${baseName}-${randomUUID()}.${extension}`;

  const uploadsRoot = path.join(process.cwd(), "uploads", "products");
  await mkdir(uploadsRoot, { recursive: true });
  await writeFile(path.join(uploadsRoot, fileName), bytes);

  return `/uploads/products/${fileName}`;
}

async function mapProductById(id: number) {
  const product = await Product.findByPk(id, {
    include: [
      { model: Category, as: "category", required: true },
      { model: ProductImage, as: "images" },
      { model: ProductSize, as: "sizes" },
      { model: ProductColor, as: "colors" },
      { model: ProductVariant, as: "variants" },
    ],
  });

  if (!product) return null;

  return {
    id: String(product.id),
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    originalPrice: product.originalPrice == null ? undefined : Number(product.originalPrice),
    images: ((product as any).images ?? []).map((image: ProductImage) => image.url),
    category: {
      id: String((product as any).category.id),
      name: (product as any).category.name,
      slug: (product as any).category.slug,
      description: (product as any).category.description ?? undefined,
      image: (product as any).category.image ?? undefined,
    },
    sizes: ((product as any).sizes ?? []).map((size: ProductSize) => ({
      id: String(size.id),
      name: size.name,
      available: size.available,
    })),
    colors: ((product as any).colors ?? []).map((color: ProductColor) => ({
      id: String(color.id),
      name: color.name,
      hex: color.hex,
      available: color.available,
    })),
    variants: ((product as any).variants ?? []).map((variant: ProductVariant) => ({
      id: String(variant.id),
      sizeName: variant.sizeName,
      colorName: variant.colorName,
      stock: variant.stock,
      sku: variant.sku ?? undefined,
      isActive: variant.isActive,
    })),
    stock: product.stock,
    featured: product.featured,
    isNew: product.isNew,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

const mapCategory = (category: Category) => ({
  id: String(category.id),
  name: category.name,
  slug: category.slug,
  description: category.description ?? undefined,
  image: category.image ?? undefined,
  isActive: category.isActive,
  createdAt: category.createdAt.toISOString(),
  updatedAt: category.updatedAt.toISOString(),
});

const mapOffer = (offer: Offer & { categories?: Category[] }) => ({
  id: String(offer.id),
  title: offer.title,
  description: offer.description,
  discountPercentage: offer.discountPercentage,
  code: offer.code ?? undefined,
  image: offer.image,
  validFrom: offer.validFrom.toISOString(),
  validUntil: offer.validUntil.toISOString(),
  active: offer.active,
  applicableCategories: (offer.get("categories") as Category[] | undefined)?.map((category) => category.slug) ?? [],
});

const mapContactMessage = (row: ContactMessage) => ({
  id: String(row.id),
  name: row.name,
  email: row.email,
  phone: row.phone ?? undefined,
  subject: row.subject,
  message: row.message,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const mapAdminOrder = (order: Order & { items?: OrderItem[] }) => {
  const items = (order.get("items") as OrderItem[] | undefined) ?? [];
  const address = order.get("address") as Address | undefined;

  return {
    id: String(order.id),
    userId: String(order.userId),
    cartId: String(order.cartId),
    addressId: order.addressId == null ? undefined : String(order.addressId),
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discountTotal),
    shippingTotal: Number(order.shippingTotal),
    total: Number(order.total),
    shippingAddress: address
      ? {
          id: String(address.id),
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
        }
      : order.shippingStreet
        ? {
            street: order.shippingStreet,
            city: order.shippingCity ?? "",
            state: order.shippingState ?? "",
            postalCode: order.shippingPostalCode ?? "",
            country: order.shippingCountry ?? "",
          }
        : undefined,
    items: items.map((item) => ({
      id: String(item.id),
      productId: String(item.productId),
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      sizeName: item.sizeName ?? undefined,
      colorName: item.colorName ?? undefined,
      subtotal: Number((Number(item.unitPrice) * item.quantity).toFixed(2)),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
};

type PasswordResetTokenWithUser = PasswordResetToken & {
  user?: User;
};

const mapPasswordResetEvent = (event: PasswordResetTokenWithUser) => {
  const now = Date.now();
  const usedAt = event.usedAt ?? null;
  const isExpired = !usedAt && event.expiresAt.getTime() <= now;

  return {
    id: String(event.id),
    userId: String(event.userId),
    userEmail: event.user?.email ?? undefined,
    providerMessageId: event.providerMessageId ?? undefined,
    requestedIp: event.requestedIp ?? undefined,
    requestedUserAgent: event.requestedUserAgent ?? undefined,
    usedIp: event.usedIp ?? undefined,
    usedUserAgent: event.usedUserAgent ?? undefined,
    expiresAt: event.expiresAt.toISOString(),
    usedAt: usedAt ? usedAt.toISOString() : undefined,
    status: usedAt ? "used" : isExpired ? "expired" : "active",
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
};

adminV1Router.get("/admin/categories", requireAuth, requireAdmin, async (_req: any, res: any) => {
  try {
    const categories = await Category.findAll({
      order: [["name", "ASC"]],
    });

    return res.status(200).json({ success: true, data: categories.map((category) => mapCategory(category)) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error al listar categorias",
    });
  }
});

adminV1Router.post("/admin/categories", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { name, slug, description, image, isActive } = req.body ?? {};

    if (!name || !slug) {
      return res.status(400).json({ success: false, data: null, message: "Nombre y slug son requeridos" });
    }

    const normalizedSlug = String(slug).trim();
    if (!isCategorySlug(normalizedSlug)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Slug invalido. Valores permitidos: hombre, mujer, ninos",
      });
    }

    const exists = await Category.findOne({ where: { slug: normalizedSlug } });
    if (exists) {
      return res.status(409).json({ success: false, data: null, message: "Ya existe una categoria con ese slug" });
    }

    const category = await Category.create({
      name: String(name).trim(),
      slug: normalizedSlug,
      description: description ? String(description) : null,
      image: image ? String(image) : null,
      isActive: isActive === undefined ? true : Boolean(isActive),
    });

    return res.status(201).json({
      success: true,
      data: mapCategory(category),
      message: "Categoria creada exitosamente",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error al crear categoria",
    });
  }
});

adminV1Router.patch("/admin/categories/:id", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, data: null, message: "ID invalido" });
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ success: false, data: null, message: "Categoria no encontrada" });
    }

    const { name, slug, description, image, isActive } = req.body ?? {};

    let nextSlug: "hombre" | "mujer" | "ninos" | undefined;

    if (slug !== undefined) {
      const normalizedSlug = String(slug).trim();
      if (!isCategorySlug(normalizedSlug)) {
        return res.status(400).json({
          success: false,
          data: null,
          message: "Slug invalido. Valores permitidos: hombre, mujer, ninos",
        });
      }

      nextSlug = normalizedSlug;

      const duplicate = await Category.findOne({ where: { slug: nextSlug } });
      if (duplicate && duplicate.id !== category.id) {
        return res.status(409).json({ success: false, data: null, message: "Ya existe una categoria con ese slug" });
      }
    }

    await category.update({
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
      ...(description !== undefined ? { description: description ? String(description) : null } : {}),
      ...(image !== undefined ? { image: image ? String(image) : null } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
    });

    return res.status(200).json({
      success: true,
      data: mapCategory(category),
      message: "Categoria actualizada exitosamente",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error al actualizar categoria",
    });
  }
});

adminV1Router.delete("/admin/categories/:id", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, data: null, message: "ID invalido" });
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ success: false, data: null, message: "Categoria no encontrada" });
    }

    const productCount = await Product.count({ where: { categoryId: category.id } });
    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        data: null,
        message: "No se puede eliminar la categoria porque tiene productos asociados",
      });
    }

    await category.destroy();

    return res.status(200).json({ success: true, data: null, message: "Categoria eliminada exitosamente" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error al eliminar categoria",
    });
  }
});

adminV1Router.get("/admin/offers", requireAuth, requireAdmin, async (_req: any, res: any) => {
  try {
    const offers = await Offer.findAll({
      include: [{ model: Category, as: "categories", through: { attributes: [] } }],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: offers.map((offer) => mapOffer(offer as never)) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error al listar promociones",
    });
  }
});

adminV1Router.post("/admin/offers", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { title, description, discountPercentage, code, image, validFrom, validUntil, active, applicableCategories } = req.body ?? {};

    if (!title || !description || discountPercentage === undefined || !image || !validFrom || !validUntil) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Titulo, descripcion, descuento, imagen y vigencia son requeridos",
      });
    }

    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(untilDate.getTime()) || fromDate > untilDate) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Rango de fechas invalido",
      });
    }

    const discount = Number(discountPercentage);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "El descuento debe estar entre 0 y 100",
      });
    }

    const categorySlugs = Array.isArray(applicableCategories) ? applicableCategories.map((slug) => String(slug)) : [];
    const categories = categorySlugs.length
      ? await Category.findAll({ where: { slug: categorySlugs, isActive: true } })
      : [];

    if (categorySlugs.length && categories.length !== new Set(categorySlugs).size) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Una o mas categorias no son validas o estan inactivas",
      });
    }

    const offer = await Offer.create({
      title: String(title).trim(),
      description: String(description).trim(),
      discountPercentage: discount,
      code: code ? String(code).trim() : null,
      image: String(image).trim(),
      validFrom: fromDate,
      validUntil: untilDate,
      active: active === undefined ? true : Boolean(active),
    });

    if (categories.length > 0) {
      await OfferCategory.bulkCreate(
        categories.map((category) => ({
          offerId: offer.id,
          categoryId: category.id,
        })),
      );
    }

    const mapped = await Offer.findByPk(offer.id, {
      include: [{ model: Category, as: "categories", through: { attributes: [] } }],
    });

    return res.status(201).json({
      success: true,
      data: mapped ? mapOffer(mapped as never) : null,
      message: "Promocion creada exitosamente",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error al crear promocion",
    });
  }
});

adminV1Router.patch("/admin/offers/:id", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, data: null, message: "ID invalido" });
    }

    const offer = await Offer.findByPk(id);
    if (!offer) {
      return res.status(404).json({ success: false, data: null, message: "Promocion no encontrada" });
    }

    const { title, description, discountPercentage, code, image, validFrom, validUntil, active, applicableCategories } = req.body ?? {};

    if (validFrom !== undefined || validUntil !== undefined) {
      const fromDate = validFrom !== undefined ? new Date(validFrom) : offer.validFrom;
      const untilDate = validUntil !== undefined ? new Date(validUntil) : offer.validUntil;
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(untilDate.getTime()) || fromDate > untilDate) {
        return res.status(400).json({ success: false, data: null, message: "Rango de fechas invalido" });
      }
    }

    if (discountPercentage !== undefined) {
      const discount = Number(discountPercentage);
      if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
        return res.status(400).json({
          success: false,
          data: null,
          message: "El descuento debe estar entre 0 y 100",
        });
      }
    }

    await offer.update({
      ...(title !== undefined ? { title: String(title).trim() } : {}),
      ...(description !== undefined ? { description: String(description).trim() } : {}),
      ...(discountPercentage !== undefined ? { discountPercentage: Number(discountPercentage) } : {}),
      ...(code !== undefined ? { code: code ? String(code).trim() : null } : {}),
      ...(image !== undefined ? { image: String(image).trim() } : {}),
      ...(validFrom !== undefined ? { validFrom: new Date(validFrom) } : {}),
      ...(validUntil !== undefined ? { validUntil: new Date(validUntil) } : {}),
      ...(active !== undefined ? { active: Boolean(active) } : {}),
    });

    if (applicableCategories !== undefined) {
      const categorySlugs = Array.isArray(applicableCategories) ? applicableCategories.map((slug) => String(slug)) : [];
      const categories = categorySlugs.length
        ? await Category.findAll({ where: { slug: categorySlugs, isActive: true } })
        : [];

      if (categorySlugs.length && categories.length !== new Set(categorySlugs).size) {
        return res.status(400).json({
          success: false,
          data: null,
          message: "Una o mas categorias no son validas o estan inactivas",
        });
      }

      await OfferCategory.destroy({ where: { offerId: offer.id } });
      if (categories.length > 0) {
        await OfferCategory.bulkCreate(
          categories.map((category) => ({
            offerId: offer.id,
            categoryId: category.id,
          })),
        );
      }
    }

    const mapped = await Offer.findByPk(offer.id, {
      include: [{ model: Category, as: "categories", through: { attributes: [] } }],
    });

    return res.status(200).json({
      success: true,
      data: mapped ? mapOffer(mapped as never) : null,
      message: "Promocion actualizada exitosamente",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error al actualizar promocion",
    });
  }
});

adminV1Router.delete("/admin/offers/:id", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, data: null, message: "ID invalido" });
    }

    const offer = await Offer.findByPk(id);
    if (!offer) {
      return res.status(404).json({ success: false, data: null, message: "Promocion no encontrada" });
    }

    await offer.destroy();

    return res.status(200).json({ success: true, data: null, message: "Promocion eliminada exitosamente" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error al eliminar promocion",
    });
  }
});

adminV1Router.post("/admin/uploads/product-image", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const body = req.body ?? {};
    const data = typeof body.data === "string" ? body.data : "";
    const fileName = typeof body.fileName === "string" ? body.fileName : undefined;
    const contentType = typeof body.contentType === "string" ? body.contentType : undefined;

    if (!data) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Debes enviar la imagen en base64",
      });
    }

    const relativeUrl = await writeUploadedImageFromBase64({ data, originalName: fileName, contentType });
    const absoluteUrl = `${resolveUploadPublicBase(req)}${relativeUrl}`;

    return res.status(201).json({
      success: true,
      data: {
        url: absoluteUrl,
        path: relativeUrl,
      },
      message: "Imagen subida exitosamente",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "No se pudo subir la imagen",
    });
  }
});

adminV1Router.post("/admin/products", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { name, description, price, originalPrice, categorySlug, stock, featured, isNew, images, variants } = req.body ?? {};

    if (!name || price === undefined || !categorySlug) {
      return res.status(400).json({ success: false, data: null, message: "Nombre, precio y categoría son requeridos" });
    }

    const category = await Category.findOne({ where: { slug: String(categorySlug), isActive: true } });
    if (!category) {
      return res.status(404).json({ success: false, data: null, message: "Categoría no encontrada" });
    }

    const baseSlug = slugify(String(name));
    const existing = await Product.count({ where: { slug: baseSlug } });
    const slug = existing > 0 ? `${baseSlug}-${Date.now()}` : baseSlug;

    const product = await Product.create({
      categoryId: category.id,
      name: String(name),
      slug,
      description: String(description ?? ""),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      stock: Number(stock ?? 0),
      featured: Boolean(featured),
      isNew: Boolean(isNew),
      isActive: true,
    });

    const imageList = sanitizeImageUrls(images);
    const persistedImages = imageList.length > 0 ? imageList : ["/images/placeholder-product.jpg"];
    await ProductImage.bulkCreate(
      persistedImages.map((url, index) => ({
        productId: product.id,
        url,
        sortOrder: index,
      })),
    );

    const normalizedVariants = Array.isArray(variants) ? variants : [];
    let nextStock = Number(stock ?? 0);

    if (normalizedVariants.length > 0) {
      const sizeNames = new Set<string>();
      const colorNames = new Set<string>();

      const variantRows = normalizedVariants.map((variant: any) => {
        const sizeName = String(variant.sizeName ?? "").trim();
        const colorName = String(variant.colorName ?? "").trim();
        const variantStock = Math.max(0, Number(variant.stock ?? 0));

        if (!sizeName || !colorName) {
          throw new Error("Cada variante requiere sizeName y colorName");
        }

        sizeNames.add(sizeName);
        colorNames.add(colorName);

        return {
          productId: product.id,
          sizeName,
          colorName,
          stock: variantStock,
          sku: variant.sku ? String(variant.sku).trim() : null,
          isActive: variant.isActive === undefined ? true : Boolean(variant.isActive),
        };
      });

      await ProductSize.bulkCreate(
        Array.from(sizeNames).map((sizeName) => ({
          productId: product.id,
          name: sizeName,
          available: true,
        })),
      );

      await ProductColor.bulkCreate(
        Array.from(colorNames).map((colorName, index) => ({
          productId: product.id,
          name: colorName,
          hex: index === 0 ? "#1a1a1a" : "#ffffff",
          available: true,
        })),
      );

      await ProductVariant.bulkCreate(variantRows);
      nextStock = variantRows.reduce((sum, variantRow) => sum + Number(variantRow.stock), 0);
    } else {
      await ProductSize.bulkCreate(
        ["S", "M", "L"].map((size) => ({
          productId: product.id,
          name: size,
          available: true,
        })),
      );

      await ProductColor.bulkCreate([
        { productId: product.id, name: "Negro", hex: "#1a1a1a", available: true },
        { productId: product.id, name: "Blanco", hex: "#ffffff", available: true },
      ]);

      const defaultSizes = ["S", "M", "L"];
      const defaultColors = ["Negro", "Blanco"];
      const combinations = defaultSizes.flatMap((sizeName) =>
        defaultColors.map((colorName) => ({ sizeName, colorName })),
      );

      const totalStock = Number(stock ?? 0);
      const baseStock = Math.floor(totalStock / combinations.length);
      let remainder = totalStock % combinations.length;

      await ProductVariant.bulkCreate(
        combinations.map((combination) => {
          const extra = remainder > 0 ? 1 : 0;
          remainder = Math.max(0, remainder - 1);

          return {
            productId: product.id,
            sizeName: combination.sizeName,
            colorName: combination.colorName,
            stock: baseStock + extra,
            isActive: true,
          };
        }),
      );

      nextStock = totalStock;
    }

    await product.update({ stock: nextStock });

    const mapped = await mapProductById(product.id);
    return res.status(201).json({ success: true, data: mapped, message: "Producto creado exitosamente" });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error instanceof Error ? error.message : "Error al crear producto" });
  }
});

adminV1Router.patch("/admin/products/:id", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, data: null, message: "ID inválido" });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, data: null, message: "Producto no encontrado" });
    }
    const { name, description, price, originalPrice, categorySlug, stock, featured, isNew, variants, images } = req.body ?? {};

    let categoryId = product.categoryId;
    if (categorySlug) {
      const category = await Category.findOne({ where: { slug: String(categorySlug), isActive: true } });
      if (!category) {
        return res.status(404).json({ success: false, data: null, message: "Categoría no encontrada" });
      }
      categoryId = category.id;
    }

    await ProductVariant.destroy({ where: { productId: product.id } });
    await ProductSize.destroy({ where: { productId: product.id } });
    await ProductColor.destroy({ where: { productId: product.id } });

    if (images !== undefined) {
      const imageList = sanitizeImageUrls(images);
      const persistedImages = imageList.length > 0 ? imageList : ["/images/placeholder-product.jpg"];

      await ProductImage.destroy({ where: { productId: product.id } });
      await ProductImage.bulkCreate(
        persistedImages.map((url, index) => ({
          productId: product.id,
          url,
          sortOrder: index,
        })),
      );
    }

    const normalizedVariants = Array.isArray(variants) ? variants : [];
    let nextStock = Number(stock ?? product.stock ?? 0);

    if (normalizedVariants.length > 0) {
      const sizeNames = new Set<string>();
      const colorNames = new Set<string>();

      const variantRows = normalizedVariants.map((variant: any) => {
        const sizeName = String(variant.sizeName ?? "").trim();
        const colorName = String(variant.colorName ?? "").trim();
        const variantStock = Math.max(0, Number(variant.stock ?? 0));

        if (!sizeName || !colorName) {
          throw new Error("Cada variante requiere sizeName y colorName");
        }

        sizeNames.add(sizeName);
        colorNames.add(colorName);

        return {
          productId: product.id,
          sizeName,
          colorName,
          stock: variantStock,
          sku: variant.sku ? String(variant.sku).trim() : null,
          isActive: variant.isActive === undefined ? true : Boolean(variant.isActive),
        };
      });

      await ProductSize.bulkCreate(
        Array.from(sizeNames).map((sizeName) => ({
          productId: product.id,
          name: sizeName,
          available: true,
        })),
      );

      await ProductColor.bulkCreate(
        Array.from(colorNames).map((colorName, index) => ({
          productId: product.id,
          name: colorName,
          hex: index === 0 ? "#1a1a1a" : "#ffffff",
          available: true,
        })),
      );

      await ProductVariant.bulkCreate(variantRows);
      nextStock = variantRows.reduce((sum, variantRow) => sum + Number(variantRow.stock), 0);
    } else {
      const defaultSizes = ["S", "M", "L"];
      const defaultColors = ["Negro", "Blanco"];
      const combinations = defaultSizes.flatMap((sizeName) =>
        defaultColors.map((colorName) => ({ sizeName, colorName })),
      );

      const totalStock = Number(stock ?? product.stock ?? 0);
      const baseStock = Math.floor(totalStock / combinations.length);
      let remainder = totalStock % combinations.length;

      await ProductSize.bulkCreate(
        defaultSizes.map((size) => ({
          productId: product.id,
          name: size,
          available: true,
        })),
      );

      await ProductColor.bulkCreate([
        { productId: product.id, name: "Negro", hex: "#1a1a1a", available: true },
        { productId: product.id, name: "Blanco", hex: "#ffffff", available: true },
      ]);

      await ProductVariant.bulkCreate(
        combinations.map((combination) => {
          const extra = remainder > 0 ? 1 : 0;
          remainder = Math.max(0, remainder - 1);

          return {
            productId: product.id,
            sizeName: combination.sizeName,
            colorName: combination.colorName,
            stock: baseStock + extra,
            isActive: true,
          };
        }),
      );

      nextStock = totalStock;
    }

    await product.update({
      ...(name ? { name: String(name), slug: slugify(String(name)) } : {}),
      ...(description !== undefined ? { description: String(description) } : {}),
      ...(price !== undefined ? { price: Number(price) } : {}),
      ...(originalPrice !== undefined ? { originalPrice: originalPrice ? Number(originalPrice) : null } : {}),
      ...(featured !== undefined ? { featured: Boolean(featured) } : {}),
      ...(isNew !== undefined ? { isNew: Boolean(isNew) } : {}),
      categoryId,
      stock: nextStock,
    });

    const mapped = await mapProductById(product.id);
    return res.status(200).json({ success: true, data: mapped, message: "Producto actualizado exitosamente" });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error instanceof Error ? error.message : "Error al actualizar producto" });
  }
});

adminV1Router.delete("/admin/products/:id", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, data: null, message: "ID inválido" });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, data: null, message: "Producto no encontrado" });
    }

    await product.destroy();

    return res.status(200).json({ success: true, data: null, message: "Producto eliminado exitosamente" });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, message: error instanceof Error ? error.message : "Error al eliminar producto" });
  }
});

adminV1Router.get("/admin/contact-messages", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const result = await ContactMessage.findAndCountAll({
      order: [["createdAt", "DESC"]],
      offset,
      limit: pageSize,
    });

    return res.status(200).json({
      success: true,
      data: result.rows.map((row) => mapContactMessage(row)),
      pagination: buildPagination(page, pageSize, result.count),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error al listar mensajes de contacto",
      pagination: buildPagination(1, 20, 0),
    });
  }
});

adminV1Router.patch(
  "/admin/contact-messages/:id/status",
  requireAuth,
  requireAdmin,
  validateParams(adminStatusIdParamSchema),
  validateBody(adminContactStatusSchema),
  async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status ?? "").trim();

    const row = await ContactMessage.findByPk(id);
    if (!row) {
      return res.status(404).json({ success: false, data: null, message: "Mensaje no encontrado" });
    }

    await row.update({ status: status as "new" | "in_progress" | "resolved" });

    return res.status(200).json({
      success: true,
      data: mapContactMessage(row),
      message: "Estado actualizado exitosamente",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error actualizando estado de mensaje",
    });
  }
});

adminV1Router.get("/admin/orders", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const result = await Order.findAndCountAll({
      include: [
        { model: OrderItem, as: "items" },
        { model: Address, as: "address" },
      ],
      distinct: true,
      order: [["createdAt", "DESC"]],
      offset,
      limit: pageSize,
    });

    return res.status(200).json({
      success: true,
      data: result.rows.map((row) => mapAdminOrder(row as Order & { items?: OrderItem[] })),
      pagination: buildPagination(page, pageSize, result.count),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error al listar pedidos",
      pagination: buildPagination(1, 20, 0),
    });
  }
});

adminV1Router.patch(
  "/admin/orders/:id/status",
  requireAuth,
  requireAdmin,
  validateParams(adminStatusIdParamSchema),
  validateBody(adminOrderStatusSchema),
  async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status ?? "").trim();

    const row = await Order.findByPk(id, {
      include: [
        { model: OrderItem, as: "items" },
        { model: Address, as: "address" },
      ],
    });
    if (!row) {
      return res.status(404).json({ success: false, data: null, message: "Pedido no encontrado" });
    }

    await row.update({ status: status as "pending" | "confirmed" | "cancelled" });

    return res.status(200).json({
      success: true,
      data: mapAdminOrder(row as Order & { items?: OrderItem[] }),
      message: "Estado de pedido actualizado exitosamente",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error actualizando estado del pedido",
    });
  }
});

adminV1Router.get("/admin/security/password-reset-events", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const page = Math.max(1, Number(req.query?.page ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(req.query?.pageSize ?? 20)));
    const email = typeof req.query?.email === "string" ? req.query.email.trim().toLowerCase() : "";

    const where: any = {};
    const include: any[] = [
      {
        model: User,
        as: "user",
        required: Boolean(email),
        ...(email ? { where: { email } } : {}),
      },
    ];

    const result = await PasswordResetToken.findAndCountAll({
      where,
      include,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      data: result.rows.map((event) => mapPasswordResetEvent(event as PasswordResetTokenWithUser)),
      pagination: {
        page,
        pageSize,
        totalItems: result.count,
        totalPages: Math.max(1, Math.ceil(result.count / pageSize)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error listando eventos de recuperación",
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 1,
      },
    });
  }
});
