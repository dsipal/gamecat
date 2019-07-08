const mongoose = require('mongoose');

const game = new mongoose.Schema({
        name: {type: String},
        description: {type: String},
        offer_ids: [{
            country_codes: [{type: String}],
            offer_id: String
        }]
    },
    {collection: 'Games'});

//static functions


//instance methods



const Game = mongoose.model('Game', game);

module.exports = Game;
