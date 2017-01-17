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

exports.up = (db, callback) => {
  // return null;
  return db.createTable( 'users', {
    id: {
      type: 'int',
      unsigned: true,
      notNull: true,
      primaryKey: true,
      autoIncrement: true
    },
    spotify_token: {
      type: 'string',
      unique: true,
      notNull: false
    },
    username: {
      type: 'string',
      notNull: true
    },
    email: {
      type: 'string',
      unique: true,
      notNull: true
    }
  })

  // return db.createTable( 'user', {
  //   id: {
  //     type: 'int',
  //     unsigned: true,
  //     notNull: true,
  //     primaryKey: true,
  //     autoIncrement: true,
  //     length: 10
  //   }
  // })
};

exports.down = function(db) {
  return db.dropTable( 'users', {});
};

exports._meta = {
  "version": 1
};



// db.createTable('users', {
//   id: {
//     type: 'int',
//     unsigned: true,
//     notNull: true,
//     primaryKey: true,
//     autoIncrement: true,
//     length: 10
//   }
  // ,
  // spotify_token:
  // {
  //   type: 'string',
  //   unique: true,
  //   notNull: true
  // },
  // username:
  // {
  //   type: 'string',
  //   notNull: true
  // },
  // email:
  // {
  //   type: 'string',
  //   unique: true,
  //   notNull: true
  // }
// }, callback)
// };
//
//
// exports.down = function(db, callback) {
// db.dropTable('users', callback);
// };
