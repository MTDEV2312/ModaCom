import { Category } from "./Category";
import { Cart } from "./Cart";
import { CartItem } from "./CartItem";
import { Offer } from "./Offer";
import { OfferCategory } from "./OfferCategory";
import { Order } from "./Order";
import { OrderItem } from "./OrderItem";
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

  User.hasMany(Cart, { foreignKey: "userId", as: "carts" });
  Cart.belongsTo(User, { foreignKey: "userId", as: "user" });

  Cart.hasMany(CartItem, { foreignKey: "cartId", as: "items" });
  CartItem.belongsTo(Cart, { foreignKey: "cartId", as: "cart" });

  Product.hasMany(CartItem, { foreignKey: "productId", as: "cartItems" });
  CartItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

  User.hasMany(Order, { foreignKey: "userId", as: "orders" });
  Order.belongsTo(User, { foreignKey: "userId", as: "user" });

  Cart.hasOne(Order, { foreignKey: "cartId", as: "order" });
  Order.belongsTo(Cart, { foreignKey: "cartId", as: "cart" });

  Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
  OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

  Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });
  OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

  initialized = true;
}

export {
  Cart,
  CartItem,
  Category,
  Offer,
  OfferCategory,
  Order,
  OrderItem,
  Product,
  ProductColor,
  ProductImage,
  ProductSize,
  User,
};
