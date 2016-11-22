'user strict'
const db = require('./database').db;


function getCompetitionPlaylists(req, res, next) {
  console.log('REQ: ', req)
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
//
// function getSingleCompetitionPlaylist(req, res, next) {
//   const userId = parseInt(req.params.userId);
//   const compId = parseInt(req.params.id);
//   if (!userID || !compId) return next();
//   db.one('select * from competitions where user_id = $1 and id = $2', userId, compId)
//     .then(function (data) {
//       res.status(200)
//         .json({
//           status: 'success',
//           data: data,
//           message: 'Retrieved ONE comp'
//         });
//     })
//     .catch(function (err) {
//       return next(err);
//     });
// }
//
// function createCompetitionPlaylist(req, res, next) {
//   req.body.age = parseInt(req.body.age);
//   const params = req.body;
//   params.userId = parseInt(req.params.userId);
//
//   db.none('insert into competitions(name, image)' +
//       'values(${name}, ${image}) where user_id = ${userId}',
//     req.body)
//     .then(function () {
//       res.status(200)
//         .json({
//           status: 'success',
//           message: 'Inserted one comp'
//         });
//     })
//     .catch(function (err) {
//       return next(err);
//     });
// }
//
// function updateCompetitionPlayList(req, res, next) {
//   console.log('params', req.params, 'body', req.body)
//   db.none('update competitions set name=$1, image=$2 where id=$3',
//     [req.body.name, req.body.image, parseInt(req.params.id)])
//     .then(function () {
//       res.status(200)
//         .json({
//           status: 'success',
//           message: 'Updated competitions'
//         });
//     })
//     .catch(function (err) {
//       return next(err);
//     });
// }
//
// function removeCompetitionPlayList(req, res, next) {
//   var compID = parseInt(req.params.id);
//   db.result('delete from competitions where id = $1', compID)
//     .then(function (result) {
//       /* jshint ignore:start */
//       res.status(200)
//         .json({
//           status: 'success',
//           message: `Removed ${result.rowCount} competition`
//         });
//       /* jshint ignore:end */
//     })
//     .catch(function (err) {
//       return next(err);
//     });
// }
//
//
module.exports = {
  getCompetitionPlaylists: getCompetitionPlaylists
//   getSingleCompetitionPlaylist: getSingleCompetitionPlaylist,
//   createCompetitionPlaylist: createCompetitionPlaylist,
//   updateCompetitionPlayList: updateCompetitionPlayList,
//   removeCompetitionPlayList: removeCompetitionPlayList
};
