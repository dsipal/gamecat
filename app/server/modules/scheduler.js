

let schedule = require('node-schedule');

let job = schedule.scheduleJob('*/1 * * * *', function(){
    console.log('Testing the scheduler');
});

module.exports = job;