'user strict';

const R = require('ramda');
const db = require('./database').db;
function getAllUsers(req, res, next) {
  db.any('select * from users')
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ALL users'
        });
    })
    .catch(function (err) {
      console.log('ERR:', err)
      return next(err);
    });
}

function getSingleUser(req, res, next) {
  var email = req.body.email;
  console.log('BODY - ', req.body)
  return db.one('select * from users where email = $1', email)
    .then(function (data) {
      return data;
    })
    .catch(function (err) {
      if (err.message == 'No data returned from the query.') {
        return null;
      }
      return next(err);
    });
}

function createUser(req, res, next) {
  console.log('req.body', req.body)
  db.none('insert into users(username, spotify_token, email)' +
      'values(${username}, ${spotify_token}, ${email})',
    req.body)
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Inserted one user'
        });
    })
    .catch(function (err) {
      console.log('ERROR - ', JSON.stringify(err))
      return next(err);
    });
}


function upsertUser(req, res, next) {
  return getSingleUser(req, res, next).then((user) => {
    if (user) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved user from DB'
        });
    } else {
      return createUser(req, res, next);
    }
    console.log('user', user)
  })
}

function updateUser(req, res, next) {
  db.none('update users set username=$1, email=$2, spotify_token=$3 where id=$4',
    [req.body.username, req.body.email, req.body.spotify_token, parseInt(req.params.id)])
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Updated user'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function removeUser(req, res, next) {
  var userID = parseInt(req.params.id);
  db.result('delete from users where id = $1', userID)
    .then(function (result) {
      /* jshint ignore:start */
      res.status(200)
        .json({
          status: 'success',
          message: `Removed ${result.rowCount} user`
        });
      /* jshint ignore:end */
    })
    .catch(function (err) {
      return next(err);
    });
}


function getUserCompetitions(req, res, next) {
  const userId = parseInt(req.params.userId)
  db.any('select * from competitions where user_id = $1', userId)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ALL users competitions'
        });
    })
    .catch(function (err) {
      console.log('ERR:', err)
      return next(err);
    });
}

module.exports = {
  upsertUser: upsertUser,
  getUserCompetitions: getUserCompetitions,
  getAllUsers: getAllUsers,
  getSingleUser: getSingleUser,
  createUser: createUser,
  updateUser: updateUser,
  removeUser: removeUser

};
