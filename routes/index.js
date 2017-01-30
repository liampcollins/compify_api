'use strict';
const express = require('express');
const router = express.Router();
const competition = require('../models/competition');
const competitionPlaylist = require('../models/competitionPlaylist');
const userCompetition = require('../models/userCompetition');

const user = require('../models/user');
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* TODO: split into separate route files */
router.post('/api/user/:userId/competitions', userCompetition.createUserCompetition);
router.get('/api/user/:userId/competitions', userCompetition.getUserCompetitions);
router.post('/api/competition/:compId/playlists', competitionPlaylist.createCompetitionPlaylists);
router.get('/api/users/:id', user.getSingleUser);
router.post('/api/users', user.upsertUser);


// router.delete('/api/competition/:compId/playlists/:playlistId', competitionPlaylist.removeCompetitionPlaylist);
// // router.get('/api/playlists/:id', playlist.getSingleCompetitionPlaylist);
// router.post('/api/playlists', playlist.createCompetitionPlaylist);
// router.put('/api/playlists/:id', playlist.updateCompetitionPlaylist);
// router.delete('/api/playlists/:id', playlist.removeCompetitionPlaylist);

// router.get('/api/competitions', competition.getAllCompetitions);
// router.get('/api/competitions/:id', competition.getSingleCompetition);
// router.post('/api/competitions', competition.createCompetition);
// router.put('/api/competitions/:id', competition.updateCompetition);
// router.delete('/api/competitions/:id', competition.removeCompetition);

// router.get('/api/users/tokens')
module.exports = router;
