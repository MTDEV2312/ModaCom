import { Router } from "express";
import {
  Category,
  ContactMessage,
  Offer,
  OfferCategory,
  Order,
  OrderItem,
  Product,
  ProductColor,
  ProductImage,
  ProductSize,
  ProductVariant,
} from "../../db/models";
import { requireAdmin, requireAuth } from "../../middleware/auth";
import { validateBody, validateParams } from "../../middleware/validate";
import { adminContactStatusSchema, adminOrderStatusSchema, adminStatusIdParamSchema } from "../../validation/schemas";

export const adminV1Router = Router();

const VALID_CATEGORY_SLUGS = ["hombre", "mujer", "ninos"] as const;

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

async function mapProductById(id: number) {
  const product = await Product.findByPk(id, {
    include: [
      { model: Category, as: "category", required: true },
      { model: ProductImage, as: "images" },
      { model: ProductSize, as: "sizes" },
      { model: ProductColor, as: "colors" },
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

  return {
    id: String(order.id),
    userId: String(order.userId),
    cartId: String(order.cartId),
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discountTotal),
    shippingTotal: Number(order.shippingTotal),
    total: Number(order.total),
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

adminV1Router.post("/admin/products", requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { name, description, price, originalPrice, categorySlug, stock, featured, isNew, images } = req.body ?? {};

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

    const imageList = Array.isArray(images) && images.length > 0 ? images : ["/images/placeholder-product.jpg"];
    await ProductImage.bulkCreate(
      imageList.map((url: string, index: number) => ({
        productId: product.id,
        url,
        sortOrder: index,
      })),
    );

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

    const { name, description, price, originalPrice, categorySlug, stock, featured, isNew } = req.body ?? {};

    let categoryId = product.categoryId;
    if (categorySlug) {
      const category = await Category.findOne({ where: { slug: String(categorySlug), isActive: true } });
      if (!category) {
        return res.status(404).json({ success: false, data: null, message: "Categoría no encontrada" });
      }
      categoryId = category.id;
    }

    await product.update({
      ...(name ? { name: String(name), slug: slugify(String(name)) } : {}),
      ...(description !== undefined ? { description: String(description) } : {}),
      ...(price !== undefined ? { price: Number(price) } : {}),
      ...(originalPrice !== undefined ? { originalPrice: originalPrice ? Number(originalPrice) : null } : {}),
      ...(stock !== undefined ? { stock: Number(stock) } : {}),
      ...(featured !== undefined ? { featured: Boolean(featured) } : {}),
      ...(isNew !== undefined ? { isNew: Boolean(isNew) } : {}),
      categoryId,
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

adminV1Router.get("/admin/contact-messages", requireAuth, requireAdmin, async (_req: any, res: any) => {
  try {
    const rows = await ContactMessage.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: rows.map((row) => mapContactMessage(row)),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error al listar mensajes de contacto",
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

adminV1Router.get("/admin/orders", requireAuth, requireAdmin, async (_req: any, res: any) => {
  try {
    const rows = await Order.findAll({
      include: [{ model: OrderItem, as: "items" }],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: rows.map((row) => mapAdminOrder(row as Order & { items?: OrderItem[] })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error al listar pedidos",
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

    const row = await Order.findByPk(id, { include: [{ model: OrderItem, as: "items" }] });
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
