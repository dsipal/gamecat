let schedule = require('node-schedule');

var j = schedule.scheduleJob('5 * * * *', function(){
    console.log('Testing the scheduler');
});