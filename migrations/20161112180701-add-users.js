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
    access_token: {
      type: 'text',
      unique: true,
      notNull: false
    },
    refresh_token: {
      type: 'text',
      unique: true,
      notNull: false
    },
    session_token: {
      type: 'text',
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
    },
    image: {
      type: 'text',
      unique: false,
      notNull: false
    }
  });
};

exports.down = function(db) {
  return db.dropTable( 'users', {});
};

exports._meta = {
  "version": 1
};
