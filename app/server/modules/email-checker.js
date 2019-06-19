// let mails = require('./mails');

const fs = require('fs');
const results = JSON.parse(fs.readFileSync(__dirname + '/mails.json', 'utf8'));

exports.isBanned = function(email) {
    let slug = email.split('@', 2);
    let mail = slug[1];
    let check = mail+'\r';
    if(results.Emails.indexOf(check) > -1){
        console.log("DISPOSABLE EMAIL");
        return false;
    } else {
        return true;
    }
};
