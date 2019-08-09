const schedule = require('node-schedule');
const Event = require('../models/Event');

// let job = schedule.scheduleJob('*/1 * * * *', function(){
//     console.log('Testing the scheduler');
// });

let newEventSchedule = function(start, end, modifier, event){

    console.log('New event with x' + modifier + ' starting at: ' + start + ' and ending at: ' + end + " the event is " + event);

    //Job to start event by changing modifier to new one
    schedule.scheduleJob(start, function(id){
        console.log('Starting a pending event, ID : ' + id);

        Event.findOne({_id: id}).then(function(ev){

            ev.startEvent().catch(function(err){
                console.log('Error with starting event : ' + err);
            });
        });

    }.bind(null, event._id));

    //Job that runs at the end date and resets the default modifier
    schedule.scheduleJob(end, function(id){
        console.log('Ending an active event, ID : ' + id);

        Event.findOne({_id: id}).then(function(ev){

            ev.endEvent().catch(function (err) {
                console.log('Error with ending event : ' + err);
            })
        });
    }.bind(null, event._id));
};

let test = function(){
    console.log('Starting test');
    let start = new Date(Date.now() + 7000);
    let end = new Date(Date.now() +50000);
    let name = 'Test Event';
    let modifier = 2;

         Event.newEvent(name,start,end,modifier, function(err, event){
            if(err){
                console.log('error in newEvent process ' + err);
            } else{
                newEventSchedule(start, end, modifier, event);
            }

        });

};

module.exports.newEventSchedule = newEventSchedule;
module.exports = test;