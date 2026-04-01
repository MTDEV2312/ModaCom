import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface ProductSizeAttributes {
  id: number;
  productId: number;
  name: string;
  available: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductSizeCreationAttributes
  extends Optional<ProductSizeAttributes, "id" | "createdAt" | "updatedAt"> {}

class ProductSize
  extends Model<ProductSizeAttributes, ProductSizeCreationAttributes>
  implements ProductSizeAttributes
{
  public id!: number;
  public productId!: number;
  public name!: string;
  public available!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductSize.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "product_sizes",
    sequelize,
  },
);

export { ProductSize };
