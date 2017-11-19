'use strict';

const R = require('ramda');
const db = require('./database').db;
const requestStates = require('../utils/ENUMS').requestStates;
const userFriends = require('./userFriends');
const userCompetition = require('./userCompetition');
const notification = require('./notification');

function removeUser(req, res, next) {
  var userID = parseInt(req.params.userId);
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

function addUserIdToSpotifyData(req, res, next) {
  const user = req.body;
  const email = user.email;
  if (!email) {
    return Promise.resolve(null);
  }
  return db.one('select * from users where email = $1', email)
    .then(function (data) {
      return Object.assign(user, { id: data.id });
    })
    .catch(function (err) {
      if (err.message == 'No data returned from the query.') {
        return null;
      }
      return next(err);
    });
}

function getUserInfo(userId) {
  let user;
  return db.one('select * from users where id = $1', userId)
    .then(function (data) {
      user = data;
      return userCompetition.getUserCompetitions(user, null, null)
    })
    .then((competitions) => {
      user.competitions = competitions;
      return userFriends.getUserFriends(userId)
    }).then((friends) => {
      user = R.merge(user, friends);
      return notification.getUserNotifications(userId)
    }).then((notifications) => {
        user.notifications = notifications;
        return user;
    }).catch((error) => {
      console.log('Error getting user info: ', error);
      return Promise.reject(err);
    })
}

function getSingleUser(req, res, next) {
  const id = req.params.userId;
  if (!id) {
    return Promise.resolve(null);
  }
  return getUserInfo(id)
    .then((user) => {
        res.status(200)
          .json({
            status: 'success',
            data: user,
            message: 'Retrieved user'
          });
    })
    .catch(function (err) {
      if (err && err.message == 'No data returned from the query.') {
        return null;
      }
      return next(err);
    });
}

function createUser(req, res, next) {
  req.body.image = (req.body.images[0] && req.body.images[0].url) ? req.body.images[0].url : "";
  return db.none('insert into users(username, email, access_token, refresh_token, session_token, image)' +
      'values(${id}, ${email}, ${access_token}, ${refresh_token}, ${session_token}, ${image})',
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
  let user;
  return addUserIdToSpotifyData(req, res, next).then((resp) => {
    user = resp;
    if (!user) {
      return createUser(req, res, next);
    } else {
      return updateUserTokens(user, next).then(() => {
        return getUserInfo(user.id)
        .then((user) => {
          res.status(200)
            .json({
              status: 'success',
              data: user,
              message: 'Retrieved ALL users competitions'
            });
        })
      });
    }
  })
  .catch(function (err) {
    console.log('ERR Getting USER:', err)
    return next(err);
  });
}

function updateUserTokens(user, next) {
  const tokenInfo = [user.access_token, user.refresh_token, user.session_token, parseInt(user.id)];
  return db.none('update users set access_token=$1, refresh_token=$2, session_token=$3 where id=$4', tokenInfo)
  .then(function () {
    return user;
  })
  .catch(function (err) {
    console.log('ERROR - ', JSON.stringify(err))
    return next(err);
  });
}

function getTokens(req, res, next) {
  const session_token = req.body.session_token;
  if (!session_token) {
    return Promise.resolve(null);
  }
  return db.one('select * from users where session_token = $1', session_token)
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

function authenticateRequest(req, res, next) {
  const userId = parseInt(req.params[0]);
  const key = req.cookies.compify_api_key;
  return db.one('select * from users where (id = $1 and session_token = $2)', [userId, key])
    .then(function (data) {
      next();
    })
    .catch(function (err) {
      console.log('Authentication err', err);
      return next(err);
    });
}

module.exports = {
  upsertUser,
  getSingleUser,
  createUser,
  removeUser,
  authenticateRequest
};
