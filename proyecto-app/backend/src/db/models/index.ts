import { Category } from "./Category";
import { Offer } from "./Offer";
import { OfferCategory } from "./OfferCategory";
import { Product } from "./Product";
import { ProductColor } from "./ProductColor";
import { ProductImage } from "./ProductImage";
import { ProductSize } from "./ProductSize";
import { User } from "./User";

let initialized = false;

export function initModelAssociations() {
  if (initialized) {
    return;
  }

  Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });
  Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

  Product.hasMany(ProductImage, { foreignKey: "productId", as: "images" });
  ProductImage.belongsTo(Product, { foreignKey: "productId", as: "product" });

  Product.hasMany(ProductSize, { foreignKey: "productId", as: "sizes" });
  ProductSize.belongsTo(Product, { foreignKey: "productId", as: "product" });

  Product.hasMany(ProductColor, { foreignKey: "productId", as: "colors" });
  ProductColor.belongsTo(Product, { foreignKey: "productId", as: "product" });

  Offer.belongsToMany(Category, {
    through: OfferCategory,
    foreignKey: "offerId",
    otherKey: "categoryId",
    as: "categories",
  });

  Category.belongsToMany(Offer, {
    through: OfferCategory,
    foreignKey: "categoryId",
    otherKey: "offerId",
    as: "offers",
  });

  initialized = true;
}

export { Category, Offer, OfferCategory, Product, ProductColor, ProductImage, ProductSize, User };
