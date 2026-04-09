import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface ProductImageAttributes {
  id: number;
  productId: number;
  url: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductImageCreationAttributes
  extends Optional<ProductImageAttributes, "id" | "createdAt" | "updatedAt"> {}

class ProductImage
  extends Model<ProductImageAttributes, ProductImageCreationAttributes>
  implements ProductImageAttributes
{
  public id!: number;
  public productId!: number;
  public url!: string;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductImage.init(
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
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "product_images",
    sequelize,
  },
);

export { ProductImage };
