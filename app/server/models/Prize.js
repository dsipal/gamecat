const mongoose = require('mongoose');

const prize = new mongoose.Schema({
        name: String,
        image_path: String,
        description: String,
        options: [{
            point_cost: Number,
            dollar_value: String
        }],
        categories: [{type: String}],
        tags: [{type: String}],
        num_purchased: Number,
        uri: String
    },
    {collection: 'Prizes'});

//static functions

prize.statics.getAll = function(callback){

    Prize.find().exec(function(err, prizes){
        callback(err, prizes);
    })
};

prize.statics.newPrize = function(){

};

//instance methods


const Prize = mongoose.model('Prize', prize);
module.exports = Prize;
