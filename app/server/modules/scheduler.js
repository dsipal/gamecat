const schedule = require('node-schedule');
const Event = require('../models/Event');

let job = schedule.scheduleJob('*/1 * * * *', function(){
    console.log('Testing the scheduler');
});

module.exports.newEventSchedule = function(start, end, modifier, event){

    console.log('New event with x' + modifier + ' starting at: ' + start + ' and ending at: ' + end + " the event is " + event);

    //Job to start event by changing modifier to new one
    schedule.scheduleJob(start, function(modifier, event){
        console.log('Starting event at : ' + start + ' changing modifier to : ' + modifier);
        event.startEvent().catch(function(err){
            console.log('Error with starting event : ' + err);
        });
    });

    //Job that runs at the end date and resets the default modifier
    schedule.scheduleJob(end, function(modifier, event){
        console.log('Ending event at: ' + end + ' previous modifier : ' + modifier);
        event.endEvent().catch(function (err) {
            console.log('Error with ending event : ' + err);
        })
    });
};

//module.exports = job;