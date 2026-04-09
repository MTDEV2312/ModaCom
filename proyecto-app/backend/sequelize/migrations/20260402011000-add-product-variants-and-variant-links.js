'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_variants', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      productId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sizeName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      colorName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sku: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addConstraint('product_variants', {
      type: 'unique',
      fields: ['productId', 'sizeName', 'colorName'],
      name: 'uniq_product_variant_combination',
    });

    await queryInterface.addColumn('cart_items', 'variantId', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'product_variants',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addColumn('order_items', 'variantId', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'product_variants',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    const products = await queryInterface.sequelize.query(
      'SELECT id, stock FROM products',
      { type: Sequelize.QueryTypes.SELECT },
    );

    for (const product of products) {
      const productId = Number(product.id);
      const totalStock = Math.max(0, Number(product.stock ?? 0));

      const sizes = await queryInterface.sequelize.query(
        'SELECT name FROM product_sizes WHERE productId = ? AND available = 1 ORDER BY id ASC',
        {
          replacements: [productId],
          type: Sequelize.QueryTypes.SELECT,
        },
      );

      const colors = await queryInterface.sequelize.query(
        'SELECT name FROM product_colors WHERE productId = ? AND available = 1 ORDER BY id ASC',
        {
          replacements: [productId],
          type: Sequelize.QueryTypes.SELECT,
        },
      );

      const sizeNames = sizes.length > 0 ? sizes.map((row) => String(row.name)) : ['UNICA'];
      const colorNames = colors.length > 0 ? colors.map((row) => String(row.name)) : ['UNICO'];

      const combinations = [];
      for (const sizeName of sizeNames) {
        for (const colorName of colorNames) {
          combinations.push({ sizeName, colorName });
        }
      }

      if (combinations.length === 0) {
        continue;
      }

      const base = Math.floor(totalStock / combinations.length);
      let remainder = totalStock % combinations.length;
      const now = new Date();

      const rows = combinations.map((combination) => {
        const extra = remainder > 0 ? 1 : 0;
        remainder = Math.max(0, remainder - 1);

        return {
          productId,
          sizeName: combination.sizeName,
          colorName: combination.colorName,
          stock: base + extra,
          sku: null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };
      });

      await queryInterface.bulkInsert('product_variants', rows);
    }

    const cartItems = await queryInterface.sequelize.query(
      'SELECT id, productId, sizeName, colorName FROM cart_items',
      { type: Sequelize.QueryTypes.SELECT },
    );

    for (const item of cartItems) {
      const variant = await queryInterface.sequelize.query(
        'SELECT id FROM product_variants WHERE productId = ? AND sizeName = ? AND colorName = ? LIMIT 1',
        {
          replacements: [
            Number(item.productId),
            item.sizeName ? String(item.sizeName) : 'UNICA',
            item.colorName ? String(item.colorName) : 'UNICO',
          ],
          type: Sequelize.QueryTypes.SELECT,
        },
      );

      if (variant.length > 0) {
        await queryInterface.sequelize.query(
          'UPDATE cart_items SET variantId = ? WHERE id = ?',
          {
            replacements: [Number(variant[0].id), Number(item.id)],
            type: Sequelize.QueryTypes.UPDATE,
          },
        );
      }
    }

    const orderItems = await queryInterface.sequelize.query(
      'SELECT id, productId, sizeName, colorName FROM order_items',
      { type: Sequelize.QueryTypes.SELECT },
    );

    for (const item of orderItems) {
      const variant = await queryInterface.sequelize.query(
        'SELECT id FROM product_variants WHERE productId = ? AND sizeName = ? AND colorName = ? LIMIT 1',
        {
          replacements: [
            Number(item.productId),
            item.sizeName ? String(item.sizeName) : 'UNICA',
            item.colorName ? String(item.colorName) : 'UNICO',
          ],
          type: Sequelize.QueryTypes.SELECT,
        },
      );

      if (variant.length > 0) {
        await queryInterface.sequelize.query(
          'UPDATE order_items SET variantId = ? WHERE id = ?',
          {
            replacements: [Number(variant[0].id), Number(item.id)],
            type: Sequelize.QueryTypes.UPDATE,
          },
        );
      }
    }

    await queryInterface.addIndex('product_variants', ['productId']);
    await queryInterface.addIndex('product_variants', ['productId', 'sizeName']);
    await queryInterface.addIndex('product_variants', ['productId', 'colorName']);
    await queryInterface.addIndex('cart_items', ['variantId']);
    await queryInterface.addIndex('order_items', ['variantId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('order_items', ['variantId']);
    await queryInterface.removeIndex('cart_items', ['variantId']);
    await queryInterface.removeIndex('product_variants', ['productId', 'colorName']);
    await queryInterface.removeIndex('product_variants', ['productId', 'sizeName']);
    await queryInterface.removeIndex('product_variants', ['productId']);

    await queryInterface.removeColumn('order_items', 'variantId');
    await queryInterface.removeColumn('cart_items', 'variantId');

    await queryInterface.removeConstraint('product_variants', 'uniq_product_variant_combination');
    await queryInterface.dropTable('product_variants');
  },
};
