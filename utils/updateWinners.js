'use strict'
const db = require('../models/database').db;
const R = require('ramda');
const bulkUpdate = require('./bulkUpdate');
const notification = require('../models/notification');
const notificationTypes = require('./ENUMS').notificationTypes;

function getWinningPlaylist(compIds) {
  return db.any('SELECT playlist_id, competition_id, COUNT(*) FROM votes WHERE competition_id in ($1) GROUP BY playlist_id, competition_id', compIds).then(playlistVotes => {
    const winnersMap = {};
    for (let i = 0; i < playlistVotes.length; i++) {
      const v = playlistVotes[i];
      if (!winnersMap[v.competition_id] || v.count > winnersMap[v.competition_id].count) {
        winnersMap[v.competition_id]  = {count: v.count, playlists: [v.playlist_id]};
      } else if (v.count === winnersMap[v.competition_id].count) {
        winnersMap[v.competition_id].playlists.push(v.playlist_id)
      }
    }
    return winnersMap;
  });
}

function getPlaylistOwners(map) {
  let playlistIds = [];
  let playlistUserMap = {};
  for (let compId in map) {
    if( map.hasOwnProperty(compId) ) {
      playlistIds.push(map[compId].playlists);
    }
  }
  playlistIds = R.uniq(R.flatten(playlistIds));
  // returns the usernames of the playlist owners
  return db.any('SELECT users.username, users.id, playlists.id, playlists.user_id FROM playlists INNER JOIN users ON playlists.user_id = users.id WHERE playlists.id in ($1)', playlistIds).then(playlists => {
    for (let i = 0; i < playlists.length; i++) {
      playlistUserMap[playlists[i].id] = playlists[i].user_id
    }
    return playlistUserMap;
  });
}

function updateWinners(playlistUserMap, winnerPlaylistMap) {
  const winnerUserArray = [];
  for (let compId in winnerPlaylistMap) {
    if( winnerPlaylistMap.hasOwnProperty(compId) ) {
      winnerPlaylistMap[compId].winners = [];
      winnerUserArray.unshift([parseInt(compId), []]);
      for (let i = 0; i < winnerPlaylistMap[compId].playlists.length; i++) {
        const playlistId = winnerPlaylistMap[compId].playlists[i];
        winnerUserArray[0][1].push(playlistUserMap[playlistId]);
        winnerPlaylistMap[compId].winners.push(playlistUserMap[playlistId]);
      }
      winnerUserArray[0][1] = winnerUserArray[0][1].toString();
    }
  }
  const qs = 'UPDATE competitions SET winner=$2 WHERE id=$1';
  return bulkUpdate.update(qs, winnerUserArray);
}

function addNotifications(compWinnersMap, compIds) {
  // playlistUserMap { '1': 38, 2: 43}
  // winnerPlaylistMap { '4': { count: '3', playlists: [ 1, 2 ], winners: [38, 39] }, '5': {count: '12', playlists: [23] }}
  return db.any('SELECT DISTINCT users.username, users.id, playlists.competition_id FROM playlists INNER JOIN users ON playlists.user_id = users.id WHERE playlists.competition_id in ($1)', compIds).then(users => {
    const notificationsInfo = [];
    const type = notificationTypes.competition_winner;
    const qs = "INSERT into notifications(user_id, type, ids) VALUES($1, $2, $3)"
    users.forEach(user => {
      if (!compWinnersMap[user.competition_id].winners.includes(user.id)) {
        notificationsInfo.push([user.id, type, JSON.stringify({winners: compWinnersMap[user.competition_id].winners, compId: user.competition_id})]);
      }
    })
    return bulkUpdate.update(qs, notificationsInfo);
  });
}

const update = (comps) => {
  const compIds = R.map(c => c.id, comps);
  let winnersMap;
  let playlistUserMap;
  return getWinningPlaylist(compIds).then((map) => {
    winnersMap = map;
    return getPlaylistOwners(winnersMap);
  }).then((resp) => {
    playlistUserMap = resp;
    return updateWinners(playlistUserMap, winnersMap);
  }).then(() => {
    return addNotifications(winnersMap, compIds);
  });
}

module.exports = {
  update
};
