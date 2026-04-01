import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface CategoryAttributes {
  id: number;
  name: string;
  slug: "hombre" | "mujer" | "ninos";
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CategoryCreationAttributes
  extends Optional<CategoryAttributes, "id" | "description" | "image" | "createdAt" | "updatedAt"> {}

class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  public id!: number;
  public name!: string;
  public slug!: "hombre" | "mujer" | "ninos";
  public description?: string | null;
  public image?: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.ENUM("hombre", "mujer", "ninos"),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "categories",
    sequelize,
  },
);

export { Category };
