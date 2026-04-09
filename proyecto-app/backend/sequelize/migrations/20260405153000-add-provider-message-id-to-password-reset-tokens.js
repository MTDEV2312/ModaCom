'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('password_reset_tokens', 'providerMessageId', {
      type: Sequelize.STRING(191),
      allowNull: true,
    });

    await queryInterface.addIndex('password_reset_tokens', ['providerMessageId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('password_reset_tokens', ['providerMessageId']);
    await queryInterface.removeColumn('password_reset_tokens', 'providerMessageId');
  },
};
