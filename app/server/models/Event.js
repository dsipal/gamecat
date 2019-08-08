const mongoose = require('mongoose');

const event = new mongoose.Schema({
        name: {type: String},
        status: {type: String},
        startDate: {type: Date},
        endDate: {type: Date},
        modifier: {type: Number}
    },
    {collection: 'Events'});

event.static.newEvent = async function(name, start, end, mod){
    Event.collection.insertOne({
        name: name,
        status: 'pending',
        startDate: start,
        endDate: end,
        modifier: mod
    }).then(function(doc){
        console.log('Inserted new event : ' + doc);
        return Event.collection.findOne({_id: doc.insertedId});
    }).catch(function (err) {
        console.log('Error creating new event : ' + err);
    });
};

event.methods.startEvent = async function(){
    try{
        let eventID = this._id;

        await Event.updateOne(
            {_id: eventID},
            {
                $set: {status: 'active'}
            }
        ).then(function () {
            console.log(this.name + ' event has become active');
        })

    } catch (err) {
        console.log(err);
    }
};

event.methods.endEvent = async function(){
    try{
        let eventID = this._id;

        await Event.updateOne(
            {_id: eventID},
            {
                $set: {status: 'over'}
            }
        ).then(function () {
            console.log(this.name + ' event has become ended');
        })

    } catch (err) {
        console.log(err);
    }
};

const Event = mongoose.model('Event', event);

module.exports = Event;