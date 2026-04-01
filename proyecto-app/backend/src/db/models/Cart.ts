import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

type CartStatus = "active" | "ordered" | "abandoned";

interface CartAttributes {
  id: number;
  userId: number;
  status: CartStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CartCreationAttributes extends Optional<CartAttributes, "id" | "status" | "createdAt" | "updatedAt"> {}

class Cart extends Model<CartAttributes, CartCreationAttributes> implements CartAttributes {
  public id!: number;
  public userId!: number;
  public status!: CartStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Cart.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM("active", "ordered", "abandoned"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "carts",
    sequelize,
  },
);

export { Cart };
