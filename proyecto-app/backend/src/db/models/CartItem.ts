import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface CartItemAttributes {
  id: number;
  cartId: number;
  productId: number;
  variantId?: number | null;
  quantity: number;
  unitPrice: number;
  sizeName?: string | null;
  colorName?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CartItemCreationAttributes
  extends Optional<CartItemAttributes, "id" | "variantId" | "sizeName" | "colorName" | "createdAt" | "updatedAt"> {}

class CartItem extends Model<CartItemAttributes, CartItemCreationAttributes> implements CartItemAttributes {
  public id!: number;
  public cartId!: number;
  public productId!: number;
  public variantId?: number | null;
  public quantity!: number;
  public unitPrice!: number;
  public sizeName?: string | null;
  public colorName?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CartItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    cartId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "carts",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    variantId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "product_variants",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    sizeName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    colorName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "cart_items",
    sequelize,
  },
);

export { CartItem };
