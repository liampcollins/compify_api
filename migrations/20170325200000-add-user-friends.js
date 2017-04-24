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
  return db.createTable('user_friends', {
     id: {
       type: 'int',
       unsigned: true,
       notNull: true,
       primaryKey: true,
       autoIncrement: true,
     },
     user_id: {
       type: 'int',
       unsigned: true,
       notNull: true,
       foreignKey: {
         name: 'user_friends_user_id_fk',
         table: 'users',
         rules: {
           onDelete: 'CASCADE',
           onUpdate: 'RESTRICT'
         },
         mapping: {
           user_id: 'id'
         }
       }
     },
     friend_id: {
       type: 'int',
       unsigned: true,
       notNull: true,
       foreignKey: {
         name: 'user_friends_friend_id_fk',
         table: 'users',
         rules: {
           onDelete: 'CASCADE',
           onUpdate: 'RESTRICT'
         },
         mapping: {
           friend_id: 'id'
         }
       }
     },
     request_state: {
       type: 'int',
       unique: false,
       notNull: false
     }
   })
};

exports.down = function(db) {
  return db.dropTable('user_friends');
};

exports._meta = {
  "version": 1
};
