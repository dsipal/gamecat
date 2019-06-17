const mongoose = require('mongoose');

const prize = new mongoose.Schema({
        name: String,
        image_path: String,
        description: String,
        cost: Number,
        categories: [{type: String}],
        tags: [{type: String}],
    },
    {collection: 'Prizes'});

//static functions

prize.statics.getAll = function(callback){
    
    Prize.find().exec(function(err, prizes){
        callback(err, prizes);
    })
};

//instance methods


const Prize = mongoose.model('Prize', prize);
module.exports = Prize;
