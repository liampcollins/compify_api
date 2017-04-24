'use strict';

const R = require('ramda');
const db = require('./database').db;

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

function getSingleUser(req, res, next) {
  const id = parseInt(req.params.id);
  let user;
  if (!id) {
    return Promise.resolve(null);
  }
  return db.one('select * from users where id = $1', id)
    .then(function (data) {
      user = data;
      return getUserCompetitions(user, res, next).then((competitions) => {
        user.competitions = competitions;
        res.status(200)
          .json({
            status: 'success',
            data: user,
            message: 'Retrieved user'
          });
      });
    })
    .catch(function (err) {
      if (err.message == 'No data returned from the query.') {
        return null;
      }
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

function addFriendRequest(req, res, user, next) {
  var data = {
    user_id: user.id,
    friend_id: req.params.id,
    request_state: 0
  }

  return db.none('insert into user_friends(user_id, friend_id, request_state)' +
      'values(${user_id}, ${friend_id}, ${request_state})',
    data).then(() => {
    res.status(200)
      .json({
        status: 'success',
        data: user,
        message: 'Friend request sent'
      });
  })
  .catch((error) => {
    console.log('Could not add friend request', error)
    return next(error);
  });
}

function addFriend(req, res, next) {
  if (!req.body.info || !req.params.id) {
    return Promise.resolve(null);
  }
  return db.one('select * from users where username = $1 OR email = $1', req.body.info).then(function (data) {
    return addFriendRequest(req, res, data, next);
  })
  .catch(function (err) {
    if (err.message === "No data returned from the query.") {
      res.status(200)
        .json({
          status: 'success',
          message: 'No user found matching your submission'
        });
      return;
    }
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

function upsertUser(req, res, next) {
  return addUserIdToSpotifyData(req, res, next).then((user) => {
    if (user) {
      return updateUserTokens(user, next).then(() => {
        return getUserCompetitions(user, res, next).then((competitions) => {
          user.competitions = competitions;
          res.status(200)
            .json({
              status: 'success',
              data: user,
              message: 'Retrieved ALL users competitions'
            });
        });
      })
    } else {
      return createUser(req, res, next);
    }
  })
  .catch(function (err) {
    console.log('ERR Getting USER:', err)
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


function getUserFriends(req, res, next) {
  const userId = req.params.id;
  if (!userId) {
    return Promise.resolve([]);
  }

  return db.any('select * from user_friends where user_id = $1 or friend_id = $1', userId)
    .then(function (resp) {
      if (!resp.length){
        return res.status(200)
          .json({
            status: 'success',
            data: resp,
            message: 'User has no friends'
          });
      }
      const friends = R.map(a => a.friend_id === parseInt(userId) ? a.user_id : a.friend_id,  resp);
      return db.any('select * from users where id in ($1)', friends).then((users) => {
        res.status(200)
          .json({
            status: 'success',
            data: users,
            message: 'Retrieved user friends'
          });
      });
    })
    .catch(function (err) {
      console.log('Get User Friends Error: ', err)
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
  upsertUser: upsertUser,
  getUserCompetitions: getUserCompetitions,
  getSingleUser: getSingleUser,
  createUser: createUser,
  removeUser: removeUser,
  getUserFriends,
  addFriend,
  authenticateRequest
};
