'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('password_reset_tokens', {
      id: {
        type: Sequelize.STRING(64),
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      tokenHash: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      usedAt: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('password_reset_tokens', ['userId']);
    await queryInterface.addIndex('password_reset_tokens', ['expiresAt']);
    await queryInterface.addIndex('password_reset_tokens', ['tokenHash'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('password_reset_tokens', ['tokenHash']);
    await queryInterface.removeIndex('password_reset_tokens', ['expiresAt']);
    await queryInterface.removeIndex('password_reset_tokens', ['userId']);
    await queryInterface.dropTable('password_reset_tokens');
  },
};
