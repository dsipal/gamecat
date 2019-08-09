const mongoose = require('mongoose');

const event = new mongoose.Schema({
        name: {type: String},
        status: {type: String},
        startDate: {type: Date},
        endDate: {type: Date},
        modifier: {type: Number}
    },
    {collection: 'Events'}
);


event.statics.newEvent = async function(name, start, end, mod, callback){
    console.log('Starting newEvent');
    // let doc = await Event.collection.insertOne({
    //     name: name,
    //     status: 'pending',
    //     startDate: start,
    //     endDate: end,
    //     modifier: mod
    // });
    // console.log('Inserted new event : ' + doc);
    //
    // let event = await Event.findOne({_id: doc.insertedId});
    //
    // if(event === null || event === undefined){
    //     console.log('event null or undefined')
    // } else{
    //     console.log('Event found, calling back' + event);
    //     callback(null, event);
    // }

    await Event.collection.insertOne({
        name: name,
        status: 'pending',
        startDate: start,
        endDate: end,
        modifier: mod
    }).then(async function(doc){
        console.log('Inserted new event : ' + doc);
        await Event.findOne({_id: doc.insertedId}).then(function (event) {
            if(event){
                callback(false, event);
            } else {
                callback('Event wasnt found after insertion', null);
            }
        }).catch(function (err) {
            console.log('Error finding new event :  ' + err);
            callback(err, null);
        });
    }).catch(function (err) {
        console.log('Error creating new event : ' + err);
        callback(err, null);
    });
};

event.methods.startEvent = async function(){
    try{
        let eventID = this._id;

        await Event.findOneAndUpdate(
            {_id: eventID},
            {
                $set: {status: 'active'}
            }, { returnOriginal: false }
        ).then(function (obj) {
            console.log(obj.name + ' event has become active');
        }).catch(function(err){
            console.log(err);
        });

    } catch (err) {
        console.log(err);
    }
};

event.methods.endEvent = async function(){
    try{
        let eventID = this._id;

        await Event.findOneAndUpdate(
            {_id: eventID},
            {
                $set: {status: 'over'}
            }, { returnOriginal: false }
        ).then(function (obj) {
            console.log(obj.name + ' event has ended');
        }).catch(function(err){
            console.log(err);
        });

    } catch (err) {
        console.log(err);
    }
};

const Event = mongoose.model('Event', event);

module.exports = Event;