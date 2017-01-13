'user strict'
const promise = require('bluebird');
const options = {
  promiseLib: promise
};
const config = require('../config/config');
const pgp = require('pg-promise')(options);
const connectionString = config.connectionString;
const db = pgp(connectionString);
module.exports = {
  db
};
