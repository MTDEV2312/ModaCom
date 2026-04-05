'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('password_reset_tokens', 'requestedIp', {
      type: Sequelize.STRING(80),
      allowNull: true,
    });

    await queryInterface.addColumn('password_reset_tokens', 'requestedUserAgent', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('password_reset_tokens', 'usedIp', {
      type: Sequelize.STRING(80),
      allowNull: true,
    });

    await queryInterface.addColumn('password_reset_tokens', 'usedUserAgent', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addIndex('password_reset_tokens', ['requestedIp']);
    await queryInterface.addIndex('password_reset_tokens', ['usedIp']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('password_reset_tokens', ['usedIp']);
    await queryInterface.removeIndex('password_reset_tokens', ['requestedIp']);

    await queryInterface.removeColumn('password_reset_tokens', 'usedUserAgent');
    await queryInterface.removeColumn('password_reset_tokens', 'usedIp');
    await queryInterface.removeColumn('password_reset_tokens', 'requestedUserAgent');
    await queryInterface.removeColumn('password_reset_tokens', 'requestedIp');
  },
};
