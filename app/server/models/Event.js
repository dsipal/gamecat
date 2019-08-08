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
    let doc = await Event.collection.insertOne({
        name: name,
        status: 'pending',
        startDate: start,
        endDate: end,
        modifier: mod
    });
    console.log('Inserted new event : ' + doc);

    let event = await Event.findOne({_id: doc.insertedId});

    if(event === null || event === undefined){
        console.log('event null or undefined')
    } else{
        console.log('Event found, calling back' + event);
        callback(null, event);
    }


    // Event.collection.insertOne({
    //     name: name,
    //     status: 'pending',
    //     startDate: start,
    //     endDate: end,
    //     modifier: mod
    // }).then(function(doc){
    //     console.log('Inserted new event : ' + doc);
    //     Event.collection.findOne({_id: doc.insertedId}).then(function (event) {
    //         if(event){
    //             console.log('Event found, calling back');
    //             callback(false, event);
    //         } else {
    //             callback('Event wasnt found after insertion', null);
    //         }
    //     }).catch(function (err) {
    //         console.log('yet another error catch oof ' + err);
    //         callback(err, null);
    //     });
    // }).catch(function (err) {
    //     console.log('Error creating new event : ' + err);
    //     callback(err, null);
    // });
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