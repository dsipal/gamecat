const mongoose = require('mongoose');

const event = new mongoose.Schema({
        name: {type: String},
        startDate: {type: Date},
        endDate: {type: Date},
        modifier: {type: Number}
    },
    {collection: 'Events'});

event.static.newEvent = function(){

};

const Event = mongoose.model('Event', event);

module.exports = Event;