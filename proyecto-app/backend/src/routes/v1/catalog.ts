import { Router } from "express";
import { Op } from "sequelize";
import { Category, Offer, Product, ProductColor, ProductImage, ProductSize, ProductVariant } from "../../db/models";
import { validateQuery } from "../../middleware/validate";
import { offersAllQuerySchema, productListQuerySchema } from "../../validation/schemas";

export const catalogV1Router = Router();

type ProductSort = "price-asc" | "price-desc" | "newest" | "name";

const asArrayParam = (value: unknown): string[] => {
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const mapProduct = (product: Product & {
  category?: Category;
  images?: ProductImage[];
  sizes?: ProductSize[];
  colors?: ProductColor[];
  variants?: ProductVariant[];
}) => ({
  id: String(product.id),
  name: product.name,
  slug: product.slug,
  description: product.description,
  price: Number(product.price),
  originalPrice: product.originalPrice == null ? undefined : Number(product.originalPrice),
  images: (product.images ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => image.url),
  category: {
    id: String(product.category?.id ?? product.categoryId),
    name: product.category?.name ?? "",
    slug: (product.category?.slug ?? "hombre") as "hombre" | "mujer" | "ninos",
    description: product.category?.description ?? undefined,
    image: product.category?.image ?? undefined,
  },
  sizes: (product.sizes ?? []).map((size) => ({
    id: String(size.id),
    name: size.name,
    available: size.available,
  })),
  colors: (product.colors ?? []).map((color) => ({
    id: String(color.id),
    name: color.name,
    hex: color.hex,
    available: color.available,
  })),
  variants: (product.variants ?? []).map((variant) => ({
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

catalogV1Router.get("/categories", async (_req: any, res: any) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: categories.map((category) => ({
        id: String(category.id),
        name: category.name,
        slug: category.slug,
        description: category.description ?? undefined,
        image: category.image ?? undefined,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error cargando categorias",
    });
  }
});

catalogV1Router.get("/products", validateQuery(productListQuerySchema), async (req: any, res: any) => {
  try {
    const page = Math.max(1, toNumber(req.query.page) ?? 1);
    const pageSize = Math.max(1, Math.min(100, toNumber(req.query.pageSize) ?? 12));
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const minPrice = toNumber(req.query.minPrice);
    const maxPrice = toNumber(req.query.maxPrice);
    const sortBy = (typeof req.query.sortBy === "string" ? req.query.sortBy : "newest") as ProductSort;
    const categorySlug = typeof req.query.category === "string" ? req.query.category : undefined;
    const sizeNames = asArrayParam(req.query.sizes);
    const colorNames = asArrayParam(req.query.colors);

    const where: any = { isActive: true };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined ? { [Op.gte]: minPrice } : {}),
        ...(maxPrice !== undefined ? { [Op.lte]: maxPrice } : {}),
      };
    }

    const query: any = {
      where,
      include: [
        {
          model: Category,
          as: "category",
          required: true,
          ...(categorySlug ? { where: { slug: categorySlug, isActive: true } } : { where: { isActive: true } }),
        },
        {
          model: ProductImage,
          as: "images",
        },
        {
          model: ProductSize,
          as: "sizes",
          ...(sizeNames.length > 0
            ? {
                where: {
                  name: { [Op.in]: sizeNames },
                  available: true,
                },
                required: true,
              }
            : {}),
        },
        {
          model: ProductColor,
          as: "colors",
          ...(colorNames.length > 0
            ? {
                where: {
                  name: { [Op.in]: colorNames },
                  available: true,
                },
                required: true,
              }
            : {}),
        },
        {
          model: ProductVariant,
          as: "variants",
          required: false,
        },
      ],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      distinct: true,
      subQuery: false,
    };

    switch (sortBy) {
      case "price-asc":
        query.order = [["price", "ASC"]];
        break;
      case "price-desc":
        query.order = [["price", "DESC"]];
        break;
      case "name":
        query.order = [["name", "ASC"]];
        break;
      case "newest":
      default:
        query.order = [["createdAt", "DESC"]];
        break;
    }

    const result = await Product.findAndCountAll(query);

    return res.status(200).json({
      success: true,
      data: result.rows.map((product) => mapProduct(product as never)),
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
      message: error instanceof Error ? error.message : "Error cargando productos",
      pagination: {
        page: 1,
        pageSize: 12,
        totalItems: 0,
        totalPages: 1,
      },
    });
  }
});

catalogV1Router.get("/products/featured", async (_req: any, res: any) => {
  try {
    const products = await Product.findAll({
      where: {
        featured: true,
        isActive: true,
      },
      include: [
        { model: Category, as: "category", required: true },
        { model: ProductImage, as: "images" },
        { model: ProductSize, as: "sizes" },
        { model: ProductColor, as: "colors" },
        { model: ProductVariant, as: "variants" },
      ],
      order: [["createdAt", "DESC"]],
      limit: 8,
    });

    return res.status(200).json({
      success: true,
      data: products.map((product) => mapProduct(product as never)),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error cargando destacados",
    });
  }
});

catalogV1Router.get("/products/new-arrivals", async (_req: any, res: any) => {
  try {
    const products = await Product.findAll({
      where: {
        isNew: true,
        isActive: true,
      },
      include: [
        { model: Category, as: "category", required: true },
        { model: ProductImage, as: "images" },
        { model: ProductSize, as: "sizes" },
        { model: ProductColor, as: "colors" },
        { model: ProductVariant, as: "variants" },
      ],
      order: [["createdAt", "DESC"]],
      limit: 8,
    });

    return res.status(200).json({
      success: true,
      data: products.map((product) => mapProduct(product as never)),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error cargando nuevos ingresos",
    });
  }
});

catalogV1Router.get("/products/:slug", async (req: any, res: any) => {
  try {
    const product = await Product.findOne({
      where: {
        slug: req.params.slug,
        isActive: true,
      },
      include: [
        { model: Category, as: "category", required: true },
        { model: ProductImage, as: "images" },
        { model: ProductSize, as: "sizes" },
        { model: ProductColor, as: "colors" },
        { model: ProductVariant, as: "variants" },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Producto no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: mapProduct(product as never),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Error cargando producto",
    });
  }
});

catalogV1Router.get("/offers", async (_req: any, res: any) => {
  try {
    const now = new Date();
    const offers = await Offer.findAll({
      where: {
        active: true,
        validFrom: { [Op.lte]: now },
        validUntil: { [Op.gte]: now },
      },
      include: [
        {
          model: Category,
          as: "categories",
          through: { attributes: [] },
        },
      ],
      order: [["validUntil", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: offers.map(mapOffer),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error cargando ofertas",
    });
  }
});

catalogV1Router.get("/offers/all", validateQuery(offersAllQuerySchema), async (req: any, res: any) => {
  try {
    const includeInactive = Boolean(req.query.includeInactive);
    const offers = await Offer.findAll({
      where: includeInactive ? undefined : { active: true },
      include: [
        {
          model: Category,
          as: "categories",
          through: { attributes: [] },
        },
      ],
      order: [["validUntil", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: offers.map(mapOffer),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      message: error instanceof Error ? error.message : "Error cargando todas las ofertas",
    });
  }
});
