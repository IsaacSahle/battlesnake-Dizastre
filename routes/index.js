"use strict";

var express = require('express');
var router = express.Router();
var Dizastre = require('../dizastre.js');

var snakes = {};

// Handle POST request to '/start'
router.post('/start', function(req, res) {
    if (snakes[req.body.game_id] === undefined) {
        snakes[req.body.game_id] = {};
    }
    
    snakes[req.body.game_id].gameData = req.body;

    return res.json(Dizastre.snakeData);
})

// Handle POST request to '/move'
router.post('/move', function(req, res) {
    var snake = snakes[req.body.game_id][req.body.you];
    
    if (snake === undefined) {
        snake = 
            snakes[req.body.game_id][req.body.you] = 
            new Dizastre(snakes[req.body.game_id].gameData);
    }
    
    return res.json(snake.getMove(req.body));
})
    
module.exports = router;
