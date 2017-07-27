const db = require('./database').db;
const requestStates = require('../utils/ENUMS').requestStates;
const R = require('ramda');

function getUserFriends(req, res, next) {
  const userId = req.params.userId;
  if (!userId) {
    return Promise.resolve([]);
  }

  return db.any('select * from user_friends where (user_id = $1 or friend_id = $1) and (request_state <> $2)', [userId, requestStates.requested])
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

function addFriendRequest(req, res, user, next) {
  var data = {
    user_id: user.id,
    friend_id: req.params.userId,
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
  if (!req.body.info || !req.params.userId) {
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


function getFriendRequests(user) {
  if (!user.id) return Promise.resolve();
  return db.any('select * from user_friends where (user_id = $1) and request_state = $2', [user.id, requestStates.requested])
  .then((resp) => {
    if (!resp.length) {
      return Promise.resolve([]);
    }
    const friends = R.map(a => a.user_id,  resp);
    return db.any('select * from users where id in ($1)', friends);
  });
}

function updateFriendRequest(req, res, next, newState) {
  if (!req.params.userId || ! req.params.friendId) {
    console.log('Error - missing params to accept friend requeast');
    return Promise.resolve();
  }
  return db.none('update user_friends set request_state=$1 where id=$2 and friend_id = $3', [newState, req.params.userId, req.params.friendId])
  ,then(() => {
    const changeType = newState ? 'approved' : 'rejected';
    res.status(200)
      .json({
        status: 'success',
        message: `Friend request successfully ${changeType}`
      });
  }).catch((err) => {
    console.log('Error - filed to update friend request ', err);
    return next(err);
  })
}

function acceptRequest(req, res, next) {
  updateFriendRequest(req, res, next, true);
}

function rejectRequest(req, res, next) {
  updateFriendRequest(req, res, next, false);
}

module.exports = {
  getUserFriends,
  addFriend,
  getFriendRequests,
  acceptRequest,
  rejectRequest
};
