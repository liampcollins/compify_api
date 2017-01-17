'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('competitions_users', {
     id: {
       type: 'int',
       unsigned: true,
       notNull: true,
       primaryKey: true,
       autoIncrement: true,
     },
     competition_id: {
       type: 'int',
       unsigned: true,
       notNull: true,
       foreignKey: {
         name: 'competitions_users_competition_id_fk',
         table: 'competitions',
         rules: {
           onDelete: 'CASCADE',
           onUpdate: 'RESTRICT'
         },
         mapping: {
           competition_id: 'id'
         }
       }
     },
     user_id: {
       type: 'int',
       unsigned: true,
       notNull: true,
       foreignKey: {
         name: 'competitions_users_user_id_fk',
         table: 'users',
         rules: {
           onDelete: 'CASCADE',
           onUpdate: 'RESTRICT'
         },
         mapping: {
           user_id: 'id'
         }
       }
     }
   })
};

exports.down = function(db) {
  return db.dropTable('competitions_users');
};

exports._meta = {
  "version": 1
};
