import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

interface OfferAttributes {
  id: number;
  title: string;
  description: string;
  discountPercentage: number;
  code?: string | null;
  image: string;
  validFrom: Date;
  validUntil: Date;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OfferCreationAttributes
  extends Optional<OfferAttributes, "id" | "code" | "createdAt" | "updatedAt"> {}

class Offer
  extends Model<OfferAttributes, OfferCreationAttributes>
  implements OfferAttributes
{
  public id!: number;
  public title!: string;
  public description!: string;
  public discountPercentage!: number;
  public code?: string | null;
  public image!: string;
  public validFrom!: Date;
  public validUntil!: Date;
  public active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Offer.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    discountPercentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "offers",
    sequelize,
  },
);

export { Offer };
