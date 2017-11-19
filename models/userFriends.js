const db = require('./database').db;
const requestStates = require('../utils/ENUMS').requestStates;
const notificationTypes = require('../utils/ENUMS').notificationTypes;

const R = require('ramda');

function getUserFriends(userId) {
  console.log('getUserFriends')
  if (!userId) {
    return Promise.resolve([]);
  }

  return db.any('select * from user_friends where (user_id = $1 or friend_id = $1) and (request_state <> $2)', [userId, requestStates.rejected])
    .then(function (resp) {
      if (!resp.length){
        return []
      }
      const friendIds = [];
      const friendRequestStates = {};
      for (let i = 0; i < resp.length; i++) {
        let id;
        if (resp[i].friend_id === parseInt(userId)) {
          id = resp[i].user_id;
          friendIds.push(id);
        } else {
          id = resp[i].friend_id;
          friendIds.push(id);
        }
        friendRequestStates[id] = resp[i].request_state;
      }
      return db.any('select * from users where id in ($1)', friendIds).then((response) => {
        const friendsAndRequests = R.map(a => {
          a.request_state = friendRequestStates[a.id];
          return a;
        },  response);
        const friendsResponse = {
          friends: R.filter(f => f.request_state === requestStates.accepted, friendsAndRequests),
          friendRequests: R.filter(f => f.request_state === requestStates.requested, friendsAndRequests)
        };
        return friendsResponse;
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
      const notificationData = {
        userId: user.id,
        type: notificationTypes.friend_requested_added,
        ids: JSON.stringify({friend_id: req.params.userId})
      }
      return db.one('insert into notifications(userId, type, ids) values (${userId}, ${type}, ${ids})', notificationData)
    }).then(() => {
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

function checkIfRequestAlreadySent(friends, userId) {
  var message;
  for (var i = 0; i < friends.length; i++) {
    if (friends[i].user_id === userId || friends[i].friend_id === userId) {
      switch (friends[i].request_state) {
        case 0:
          message = 'Friend request already sent and is pending approval';
          break;
        case 1:
          message = 'User matching your submission is already a friend';
          break;
        case 2:
          message = 'Friend request already sent and was rejected';
          break;
        default:
          message = 'Friend request already sent';
      }
    }
  }
  return message;
}

function addFriend(req, res, next) {
  if (!req.body.info || !req.params.userId) {
    return Promise.resolve(null);
  }
  var user;
  return db.one('select * from users where username = $1 OR email = $1', req.body.info).then(function (data) {
    user = data;
    return db.any('select * from user_friends where user_id = $1 OR friend_id = $1', user.id).then(function (resp) {
      var message = checkIfRequestAlreadySent(resp, parseInt(req.params.userId));
      if (message) {
        res.status(200).json({
          status: 'success',
          message
        });
      } else {
        return addFriendRequest(req, res, data, next);
      }
    });
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

// function getFriendRequests(user) {
//   if (!user.id) return Promise.resolve();
//   return db.any('select * from user_friends where (user_id = $1) and request_state = $2', [user.id, requestStates.requested])
//   .then((resp) => {
//     if (!resp.length) {
//       return Promise.resolve([]);
//     }
//     const friends = R.map(a => a.user_id,  resp);
//     return db.any('select * from users where id in ($1)', friends);
//   });
// }

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
  // getFriendRequests,
  acceptRequest,
  rejectRequest
};
