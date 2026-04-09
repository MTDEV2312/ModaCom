import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

type OrderStatus = "pending" | "confirmed" | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed";

interface OrderAttributes {
  id: number;
  userId: number;
  cartId: number;
  addressId?: number | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  shippingStreet?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes
  extends Optional<
    OrderAttributes,
    | "id"
    | "addressId"
    | "status"
    | "paymentStatus"
    | "discountTotal"
    | "shippingTotal"
    | "shippingStreet"
    | "shippingCity"
    | "shippingState"
    | "shippingPostalCode"
    | "shippingCountry"
    | "createdAt"
    | "updatedAt"
  > {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public userId!: number;
  public cartId!: number;
  public addressId?: number | null;
  public status!: OrderStatus;
  public paymentStatus!: PaymentStatus;
  public subtotal!: number;
  public discountTotal!: number;
  public shippingTotal!: number;
  public total!: number;
  public shippingStreet?: string | null;
  public shippingCity?: string | null;
  public shippingState?: string | null;
  public shippingPostalCode?: string | null;
  public shippingCountry?: string | null;
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
    addressId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "addresses",
        key: "id",
      },
      onDelete: "SET NULL",
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
    shippingStreet: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shippingCity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shippingState: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shippingPostalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shippingCountry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "orders",
    sequelize,
  },
);

export { Order };
