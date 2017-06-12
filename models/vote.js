'use strict';

const db = require('./database').db;

function voteForPlaylist(req, res, next) {
  if (!req.params.userId || !req.params.compId || !req.params.playlistId) {
    console.log('Error - missing params to add vote')
    return Promise.resolve('Error');
  }
  return db.none('insert into votes(user_id, competition_id, playlist_id)' +
      'values(${userId}, ${compId}, ${playlistId})',
    req.params)
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

module.exports = {
  voteForPlaylist
}
