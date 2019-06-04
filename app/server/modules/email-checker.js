// let test[] = require('./mails');

var fs = require('fs');
var results = JSON.parse(fs.readFileSync('app/server/modules/mails.json', 'utf8'));

exports.checkBannedEmails = function(email) {
    var slug = email.split('@', 2);
    var mail = slug[1];
    var check = mail+'\r';
    if(results.Emails.indexOf(check) > -1){
        console.log("DISPOSABLE EMAIL");
        return false;
    } else {
        return true;
    }
}