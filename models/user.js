'user strict';

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
  const username = req.params.id;
  let user;
  if (!username) {
    return Promise.resolve(null);
  }
  return db.one('select * from users where username = $1', username)
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


function addUserToSpotifyData(req, res, next) {
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

function updateUserTokens(user, next) {
  return db.none('insert into users(access_token, refresh_token, session_token)' +
      'values(${access_token}, ${refresh_token}, ${session_token})',
    user)
  .then(function () {
    return user;
  })
  .catch(function (err) {
    console.log('ERROR - ', JSON.stringify(err))
    return next(err);
  });
}

function upsertUser(req, res, next) {
  return addUserToSpotifyData(req, res, next).then((user) => {
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

module.exports = {
  upsertUser: upsertUser,
  getUserCompetitions: getUserCompetitions,
  getSingleUser: getSingleUser,
  createUser: createUser,
  removeUser: removeUser
};
