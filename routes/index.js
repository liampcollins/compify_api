'use strict';
const express = require('express');
const router = express.Router();

const vote = require('../models/vote');
const user = require('../models/user');
const userFriends = require('../models/userFriends');
const userCompetition = require('../models/userCompetition');
const competitionPlaylist = require('../models/competitionPlaylist');

router.get('/api/users/*', function(req, res, next) {
  user.authenticateRequest(req, res, next);
});

// user
router.get('/api/users/:userId', user.getSingleUser);
router.post('/api/user', user.upsertUser);

// userFriends
router.post('/api/users/:userId/friend/new', userFriends.addFriend);
router.get('/api/users/:userId/friends', userFriends.getUserFriends);
router.post('/api/users/:userId/friends/:fiendId/accept', userFriends.acceptRequest);
router.post('/api/users/:userId/friends/:fiendId/reject', userFriends.rejectRequest);

// userCompetition
router.post('/api/user/:userId/competitions', userCompetition.createUserCompetition);
router.get('/api/user/:userId/competitions', userCompetition.getUserCompetitions);

// competitionPlaylist
router.post('/api/user/:userId/competitions/:compId/playlists', competitionPlaylist.addPlaylistToCompetition);

// votes
router.post('/api/user/:userId/competitions/:compId/playlists/:playlistId/vote', vote.voteForPlaylist);
module.exports = router;
