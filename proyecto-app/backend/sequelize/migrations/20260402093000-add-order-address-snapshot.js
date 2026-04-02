'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'addressId', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'addresses',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addColumn('orders', 'shippingStreet', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'shippingCity', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'shippingState', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'shippingPostalCode', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('orders', 'shippingCountry', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addIndex('orders', ['addressId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('orders', ['addressId']);
    await queryInterface.removeColumn('orders', 'shippingCountry');
    await queryInterface.removeColumn('orders', 'shippingPostalCode');
    await queryInterface.removeColumn('orders', 'shippingState');
    await queryInterface.removeColumn('orders', 'shippingCity');
    await queryInterface.removeColumn('orders', 'shippingStreet');
    await queryInterface.removeColumn('orders', 'addressId');
  },
};
