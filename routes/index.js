'use strict';
const express = require('express');
const router = express.Router();
const competition = require('../models/competition');
const user = require('../models/user');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
//
router.get('/api/user/:userId/competitions', user.getUserCompetitions);

router.get('/api/competitions', competition.getAllCompetitions);
router.get('/api/competitions/:id', competition.getSingleCompetition);
router.post('/api/competitions', competition.createCompetition);
router.put('/api/competitions/:id', competition.updateCompetition);
router.delete('/api/competitions/:id', competition.removeCompetition);


router.get('/api/users', user.getAllUsers);
router.get('/api/users/:id', user.getSingleUser);
router.post('/api/users', user.createUser);
router.put('/api/users/:id', user.updateUser);
router.delete('/api/users/:id', user.removeUser);

module.exports = router;
