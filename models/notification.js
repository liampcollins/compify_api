'use strict';

const db = require('./database').db;
const bulkUpdate = require('../utils/bulkUpdate');
function addNotifications(type, ids, users, next) {
  const queryString = 'insert into notifications(type, ids, user_id)' +
      'values(${type}, ${ids}, ${user_id})';

  const params = [];
  for (var i = 0; i < users.length; i++) {
    params.push({type, ids, user_id: users[i]})
  }
  bulkUpdate.update(queryString, parameters)
  .then(function () {
    res.status(200)
      .json({
        status: 'success',
        message: 'Vote added'
      });
  })
  .catch(function (err) {
    console.log('ERROR - error adding vote ', JSON.stringify(err))
    return next(err);
  });
}

function getUserNotifications(userId) {
    return db.any('select * from notifications where user_id = $1', userId);
}

module.exports = {
  addNotifications,
  getUserNotifications
}
