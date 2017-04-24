'user strict'
const db = require('./database').db;

function createCompetitionPlaylists(req, res, next) {
  return db.one('insert into playlists(user_id, spotify_id, competition_id)' +
      'values(${user_id}, ${spotify_id}, ${competition_id})', req.body)
    .then(function () {
      res.status(200)
      .json({
        status: 'success',
        message: 'Playlist added to competition'
      });
    })
    .catch(function (err) {
      console.log('ERR:', err)
      return next(err);
    });
}

function getCompetitionPlaylists(req, res, next) {
  const compId = parseInt(req.params.compId)
  db.any('select * from playlists where competition_id = $1', compId)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ALL competition playlists'
        });
    })
    .catch(function (err) {
      console.log('ERR:', err)
      return next(err);
    });
}

function removeCompetitionPlaylist(req, res, next) {
  const compID = parseInt(req.params.compId);
  const playlistId = parseInt(req.params.playlistId)

  db.result('delete from playlists where id=$1 and competition_id=$2', [playlistId, compId])
    .then(function (result) {
      /* jshint ignore:start */
      res.status(200)
        .json({
          status: 'success',
          message: `Removed ${result.rowCount} playlist`
        });
      /* jshint ignore:end */
    })
    .catch(function (err) {
      return next(err);
    });
}


module.exports = {
  createCompetitionPlaylists,
  getCompetitionPlaylists,
//   getSingleCompetitionPlaylist: getSingleCompetitionPlaylist,
//   createCompetitionPlaylist: createCompetitionPlaylist,
//   updateCompetitionPlayList: updateCompetitionPlayList,
  removeCompetitionPlaylist
};
