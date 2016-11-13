var express = require('express');
var router = express.Router();

var db = require('./queries');

router.get('/api/competitions', db.getAllCompetitions);
router.get('/api/competitions/:id', db.getSingleCompetition);
router.post('/api/competitions', db.createCompetition);
router.put('/api/competitions/:id', db.updateCompetition);
router.delete('/api/competitions/:id', db.removeCompetition);


module.exports = router;
