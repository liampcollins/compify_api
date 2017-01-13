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
  const user = req.body;
  const email = user.email;
  if (!email) {
    return Promise.resolve(null);
  }
  return db.one('select * from users where email = $1', email)
    .then(function (data) {
      return Object.assign(user, data);
    })
    .catch(function (err) {
      if (err.message == 'No data returned from the query.') {
        return null;
      }
      return next(err);
    });
}

function createUser(req, res, next) {
  return db.none('insert into users(username, spotify_token, email)' +
      'values(${id}, ${spotify_token}, ${email})',
    req.body)
    .then(function () {
      res.status(200)
        .json({
          data: req.body,
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
  req.body.spotify_token = "dsfdsfsds"
  return getSingleUser(req, res, next).then((user) => {
    if (user) {
      return getUserCompetitions(user, res, next).then((competitions) => {
        user.competitions = competitions;
        console.log('user', user);
        res.status(200)
          .json({
            status: 'success',
            data: user,
            message: 'Retrieved ALL users competitions'
          });
      });
    } else {
      return createUser(req, res, next);
    }
  })
  .catch(function (err) {
    console.log('ERR Getting USER:', err)
    return next(err);
  });
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


function getUserCompetitions(user, res, next) {
  const userId = parseInt(user.id);
  return db.task(t => {
    return t.map('SELECT * FROM competitions WHERE user_id = $1', userId, comp => {
      return t.any('SELECT * FROM playlists WHERE competition_id = $1', comp.id).then(playlists => {
        comp.playlists = playlists;
        return comp;
      });
    }).then(t.batch) /* this is short for: data => t.batch(data) */
  })
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
