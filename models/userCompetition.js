'user strict'
const db = require('./database').db;
const moment = require('moment');
const R = require('ramda');
const updateWinners = require('../utils/updateWinners');

function checkForNewWinner(comps) {
  const compsNeedingUdate = [];
  comps.forEach(c => {
    if (c.vote_end_date < moment() && !c.winner && c.playlists && c.playlists.length) {
      compsNeedingUdate.push(c);
    }
  });
  return compsNeedingUdate;
}

function getUserCompetitions(user, res, next) {
  const userId = parseInt(user.id);
  return db.task(t => {
    return t.map('SELECT * FROM competitions WHERE user_id = $1', userId, comp => {
      return t.any('SELECT * FROM playlists WHERE competition_id = $1', comp.id).then(playlists => {
        comp.playlists = playlists;
        return comp;
      });
    }).then(t.batch)
  }).then((competitions) => {
    const compsNeedingWinnerUpdate = checkForNewWinner(competitions);
    if(!compsNeedingWinnerUpdate.length) {
      return competitions;
    } else {
      return updateWinners.update(compsNeedingWinnerUpdate).then(() => {
        return competitions;
      })
    }
  })
}

function createCompetition(req, res, next) {
  return db.one('insert into competitions(user_id, name, theme, song_count, submission_end_date, vote_end_date)' +
      'values(${user_id}, ${name}, ${theme}, ${song_count}, ${submission_end_date}, ${vote_end_date}) returning id',
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

module.exports = {
  createUserCompetition,
  getUserCompetitions
};
