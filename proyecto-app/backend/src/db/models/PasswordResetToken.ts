import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface PasswordResetTokenAttributes {
  id: string;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  providerMessageId?: string | null;
  requestedIp?: string | null;
  requestedUserAgent?: string | null;
  usedIp?: string | null;
  usedUserAgent?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PasswordResetTokenCreationAttributes
  extends Optional<
    PasswordResetTokenAttributes,
    "id" | "usedAt" | "providerMessageId" | "requestedIp" | "requestedUserAgent" | "usedIp" | "usedUserAgent" | "createdAt" | "updatedAt"
  > {}

class PasswordResetToken
  extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreationAttributes>
  implements PasswordResetTokenAttributes
{
  public id!: string;
  public userId!: number;
  public tokenHash!: string;
  public expiresAt!: Date;
  public usedAt?: Date | null;
  public providerMessageId?: string | null;
  public requestedIp?: string | null;
  public requestedUserAgent?: string | null;
  public usedIp?: string | null;
  public usedUserAgent?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PasswordResetToken.init(
  {
    id: {
      type: DataTypes.STRING(64),
      allowNull: false,
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
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    providerMessageId: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    requestedIp: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    requestedUserAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    usedIp: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    usedUserAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "password_reset_tokens",
    sequelize,
  },
);

export { PasswordResetToken };
