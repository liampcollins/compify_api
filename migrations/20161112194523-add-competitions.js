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
  return db.createTable( 'competitions', {
    id: {
      type: 'int',
      unsigned: true,
      notNull: true,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: 'int',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'competitions_user_id_fk',
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
    name: {
      type: 'string',
      notNull: true

    },
    image: {
      type: 'text',
      notNull: true
    },
    theme: {
      type: 'string',
      notNull: true
    },
    song_count: {
      type: 'int',
      notNull: true,
      unsigned: true
    },
    submission_end_date: {
      type: 'date',
      notNull: true
    },
    vote_end_date: {
      type: 'date',
      notNull: true
    },
    winner: {
      type: 'text',
      notNull: false
    }
  })
};

exports.down = function(db) {
  return db.dropTable('competitions');
};

exports._meta = {
  "version": 1
};
