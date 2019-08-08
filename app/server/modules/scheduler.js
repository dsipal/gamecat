let schedule = require('node-schedule');

schedule.scheduleJob('*/10 * * * * *', function(){
    console.log('Testing the scheduler');
});
