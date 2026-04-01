import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

type OrderStatus = "pending" | "confirmed" | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed";

interface OrderAttributes {
  id: number;
  userId: number;
  cartId: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes
  extends Optional<
    OrderAttributes,
    "id" | "status" | "paymentStatus" | "discountTotal" | "shippingTotal" | "createdAt" | "updatedAt"
  > {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public userId!: number;
  public cartId!: number;
  public status!: OrderStatus;
  public paymentStatus!: PaymentStatus;
  public subtotal!: number;
  public discountTotal!: number;
  public shippingTotal!: number;
  public total!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init(
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
    cartId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "carts",
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "paid", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discountTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    shippingTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "orders",
    sequelize,
  },
);

export { Order };
