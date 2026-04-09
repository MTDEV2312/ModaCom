import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface ProductVariantAttributes {
  id: number;
  productId: number;
  sizeName: string;
  colorName: string;
  stock: number;
  sku?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductVariantCreationAttributes
  extends Optional<ProductVariantAttributes, "id" | "sku" | "isActive" | "createdAt" | "updatedAt"> {}

class ProductVariant
  extends Model<ProductVariantAttributes, ProductVariantCreationAttributes>
  implements ProductVariantAttributes
{
  public id!: number;
  public productId!: number;
  public sizeName!: string;
  public colorName!: string;
  public stock!: number;
  public sku?: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductVariant.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    sizeName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    colorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "product_variants",
    indexes: [{ unique: true, fields: ["productId", "sizeName", "colorName"] }],
    sequelize,
  },
);

export { ProductVariant };
