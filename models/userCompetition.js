'user strict'
const db = require('./database').db;


function getUserCompetitions(req, res, next) {
  const userId = parseInt(req.params.userId)
  db.any('SELECT c.* FROM competitions c join competitions_users cu on c.id = cu.competition_id join users u on u.id = cu.user_id where u.id = $1', userId)
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

function createCompetition(req, res, next) {
  return db.one('insert into competitions(user_id, name, theme, song_count, submission_end_date, vote_end_date, image)' +
      'values(${user_id}, ${name}, ${theme}, ${song_count}, ${submission_end_date}, ${vote_end_date}, ${image}) returning id',
    req.body);
}

function addUserToCompetition(userId, compId) {
  const data = {userId, compId};
  return db.none('insert into competitions_users(user_id, competition_id)' +
      'values(${userId}, ${compId})',
    data);
}


function createUserCompetition(req, res, next) {
  let compId;
  return createCompetition(req, res, next)
    .then((data) => {
      compId = data.id;
      return addUserToCompetition(req.body.user_id, compId);
    })
    .then(() => {
      res.status(200)
        .json({
          data: compId,
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
