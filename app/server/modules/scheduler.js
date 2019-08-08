let schedule = require('node-schedule');

schedule.scheduleJob('*/1 * * * *', function(){
    console.log('Testing the scheduler');
});
