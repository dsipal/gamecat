let schedule = require('node-schedule');

let j = schedule.scheduleJob('5 * * * *', function(){
    console.log('Testing the scheduler');
});

j.start();