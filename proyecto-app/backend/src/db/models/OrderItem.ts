import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface OrderItemAttributes {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  sizeName?: string | null;
  colorName?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderItemCreationAttributes
  extends Optional<OrderItemAttributes, "id" | "sizeName" | "colorName" | "createdAt" | "updatedAt"> {}

class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public productName!: string;
  public quantity!: number;
  public unitPrice!: number;
  public sizeName?: string | null;
  public colorName?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "orders",
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
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
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
    tableName: "order_items",
    sequelize,
  },
);

export { OrderItem };
