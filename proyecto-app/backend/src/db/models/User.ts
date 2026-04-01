import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: "customer" | "admin";
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt"> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public passwordHash!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: "customer" | "admin";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("customer", "admin"),
      allowNull: false,
      defaultValue: "customer",
    },
  },
  {
    tableName: "users",
    sequelize,
  },
);

export { User };
