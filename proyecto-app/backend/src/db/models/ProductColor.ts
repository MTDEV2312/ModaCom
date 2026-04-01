import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface ProductColorAttributes {
  id: number;
  productId: number;
  name: string;
  hex: string;
  available: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductColorCreationAttributes
  extends Optional<ProductColorAttributes, "id" | "createdAt" | "updatedAt"> {}

class ProductColor
  extends Model<ProductColorAttributes, ProductColorCreationAttributes>
  implements ProductColorAttributes
{
  public id!: number;
  public productId!: number;
  public name!: string;
  public hex!: string;
  public available!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductColor.init(
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
    hex: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "product_colors",
    sequelize,
  },
);

export { ProductColor };
