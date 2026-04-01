import { Op } from "sequelize";
import { sequelize } from "./sequelize";
import {
  Category,
  Offer,
  OfferCategory,
  Product,
  ProductColor,
  ProductImage,
  ProductSize,
  initModelAssociations,
} from "./models";

const categorySeed = [
  {
    name: "Hombre",
    slug: "hombre" as const,
    description: "Coleccion masculina de moda y estilo",
    image: "/images/categories/men.jpg",
    isActive: true,
  },
  {
    name: "Mujer",
    slug: "mujer" as const,
    description: "Coleccion femenina con las ultimas tendencias",
    image: "/images/categories/women.jpg",
    isActive: true,
  },
  {
    name: "Ninos",
    slug: "ninos" as const,
    description: "Moda infantil comoda y divertida",
    image: "/images/categories/kids.jpg",
    isActive: true,
  },
];

const productSeed = [
  {
    name: "Chaqueta Premium Wool",
    slug: "chaqueta-premium-wool",
    description: "Chaqueta de lana premium con corte moderno y acabados de alta calidad.",
    price: 189.99,
    originalPrice: 249.99,
    stock: 25,
    featured: true,
    isNew: false,
    categorySlug: "hombre" as const,
    images: ["/images/products/jacket-1.jpg", "/images/products/jacket-1-alt.jpg"],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Negro", hex: "#1a1a1a" },
      { name: "Azul Marino", hex: "#1e3a5f" },
    ],
  },
  {
    name: "Vestido Elegance Midi",
    slug: "vestido-elegance-midi",
    description: "Vestido midi con diseno elegante y tejido de alta calidad.",
    price: 149.99,
    stock: 20,
    featured: true,
    isNew: true,
    categorySlug: "mujer" as const,
    images: ["/images/products/dress-1.jpg"],
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Beige", hex: "#d4c5b0" },
      { name: "Blanco", hex: "#ffffff" },
    ],
  },
  {
    name: "Conjunto Sport Kids",
    slug: "conjunto-sport-kids",
    description: "Conjunto deportivo para ninos con tejido transpirable.",
    price: 49.99,
    originalPrice: 69.99,
    stock: 40,
    featured: true,
    isNew: false,
    categorySlug: "ninos" as const,
    images: ["/images/products/kids-sport-1.jpg"],
    sizes: ["XS", "S", "M"],
    colors: [
      { name: "Azul Marino", hex: "#1e3a5f" },
      { name: "Gris", hex: "#6b7280" },
    ],
  },
];

export async function bootstrapDatabase() {
  initModelAssociations();
  await sequelize.authenticate();
  await sequelize.sync();
  await seedBaseCatalog();
}

async function seedBaseCatalog() {
  const categoryCount = await Category.count();
  if (categoryCount === 0) {
    await Category.bulkCreate(categorySeed);
  }

  const productCount = await Product.count();
  if (productCount === 0) {
    const categories = await Category.findAll();
    const categoryMap = new Map(categories.map((category) => [category.slug, category.id]));

    for (const seed of productSeed) {
      const categoryId = categoryMap.get(seed.categorySlug);
      if (!categoryId) {
        continue;
      }

      const product = await Product.create({
        categoryId,
        name: seed.name,
        slug: seed.slug,
        description: seed.description,
        price: seed.price,
        originalPrice: seed.originalPrice ?? null,
        stock: seed.stock,
        featured: seed.featured,
        isNew: seed.isNew,
        isActive: true,
      });

      await ProductImage.bulkCreate(
        seed.images.map((url, index) => ({
          productId: product.id,
          url,
          sortOrder: index,
        })),
      );

      await ProductSize.bulkCreate(
        seed.sizes.map((name) => ({
          productId: product.id,
          name,
          available: true,
        })),
      );

      await ProductColor.bulkCreate(
        seed.colors.map((color) => ({
          productId: product.id,
          name: color.name,
          hex: color.hex,
          available: true,
        })),
      );
    }
  }

  const offerCount = await Offer.count();
  if (offerCount === 0) {
    const categories = await Category.findAll({
      where: {
        slug: {
          [Op.in]: ["hombre", "mujer", "ninos"],
        },
      },
    });

    const offer = await Offer.create({
      title: "Rebajas de Temporada",
      description: "Hasta 40% de descuento en toda la coleccion de invierno",
      discountPercentage: 40,
      code: "WINTER40",
      image: "/images/offers/winter-sale.jpg",
      validFrom: new Date("2024-01-01T00:00:00Z"),
      validUntil: new Date("2026-12-31T23:59:59Z"),
      active: true,
    });

    await OfferCategory.bulkCreate(
      categories.map((category) => ({
        offerId: offer.id,
        categoryId: category.id,
      })),
    );
  }
}
