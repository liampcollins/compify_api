'user strict'
const db = require('./database').db;


function getUserCompetitions(req, res, next) {
  const userId = parseInt(req.params.userId)
  db.any('select * from competitions where user_id = $1', userId)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ALL users competitions'
        });
    })
    .catch(function (err) {
      console.log('ERR:', err)
      return next(err);
    });
}

function getSingleUserCompetition(req, res, next) {
  const userId = parseInt(req.params.userId);
  const compId = parseInt(req.params.id);
  if (!userID || !compId) return next();
  db.one('select * from competitions where user_id = $1 and id = $2', userId, compId)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ONE comp'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function createUserCompetition(req, res, next) {
  db.one('insert into competitions(user_id, name, theme, song_count, submission_end_date, vote_end_date, image)' +
      'values(${user_id}, ${name}, ${theme}, ${song_count}, ${submission_end_date}, ${vote_end_date}, ${image}) returning id',
    req.body)
    .then(function (data) {
      res.status(200)
        .json({
          data: data,
          status: 'success',
          message: 'Inserted one comp'
        });
    })
    .catch(function (err) {
      console.log('ERR: ', err)
      return next(err);
    });
}

function updateUserCompetition(req, res, next) {
  db.none('update competitions set name=$1, image=$2 where id=$3',
    [req.body.name, req.body.image, parseInt(req.params.id)])
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Updated competitions'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function removeUserCompetition(req, res, next) {
  var compID = parseInt(req.params.id);
  db.result('delete from competitions where id = $1', compID)
    .then(function (result) {
      /* jshint ignore:start */
      res.status(200)
        .json({
          status: 'success',
          message: `Removed ${result.rowCount} competition`
        });
      /* jshint ignore:end */
    })
    .catch(function (err) {
      return next(err);
    });
}


module.exports = {
  createUserCompetition,
  getUserCompetitions
};
