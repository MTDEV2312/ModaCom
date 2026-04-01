import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize";

class OfferCategory extends Model {
  public offerId!: number;
  public categoryId!: number;
}

OfferCategory.init(
  {
    offerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "offers",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      primaryKey: true,
    },
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "categories",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      primaryKey: true,
    },
  },
  {
    tableName: "offer_categories",
    sequelize,
    timestamps: false,
  },
);

export { OfferCategory };
