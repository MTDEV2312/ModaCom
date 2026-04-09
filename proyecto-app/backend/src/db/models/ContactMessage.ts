import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

type ContactStatus = "new" | "in_progress" | "resolved";

interface ContactMessageAttributes {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContactMessageCreationAttributes
  extends Optional<ContactMessageAttributes, "id" | "phone" | "status" | "createdAt" | "updatedAt"> {}

class ContactMessage
  extends Model<ContactMessageAttributes, ContactMessageCreationAttributes>
  implements ContactMessageAttributes
{
  public id!: number;
  public name!: string;
  public email!: string;
  public phone?: string | null;
  public subject!: string;
  public message!: string;
  public status!: ContactStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ContactMessage.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("new", "in_progress", "resolved"),
      allowNull: false,
      defaultValue: "new",
    },
  },
  {
    tableName: "contact_messages",
    sequelize,
  },
);

export { ContactMessage };
