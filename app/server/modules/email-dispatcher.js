//TODO set these in env vars for security.
const api_key = '5deaec470757fa366ff8755054a08005-16ffd509-d3df6418';
const domain = 'sandboxf2ab2d4c9c19447ba48159645025e909.mailgun.org';

const mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

//TODO set up email_optin list
const list = mailgun.lists('testing@sandboxf2ab2d4c9c19447ba48159645025e909.mailgun.org');

exports.dispatchConfirm = function(email, token, name) {

    const html = "Confirmation Link: " + `<a href="http://localhost:8080/verify?id=` + token + '&name=' + name + '"> Click Here </a>';
    const data = {
        from: "Excited User <me@samples.mailgun.org>",
        to: email,
        subject: 'Account Confirmation',
        html: html
    };

    mailgun.messages().send(data, function(err, bod){
        console.log(bod);
    });
};

exports.joinMailingList = function(email, name) {

    let data = {
        address:    email,
        name:       name
    };

    list.members().create(data, function(err, data){
        console.log('New Member On Mail List:');
        console.log(data);
    });
};

exports.dispatchPasswordReset = function(email, token, name){

    const html = 'Password Reset Link: ' + '<a href="http://localhost:8080/verify?id=' + token + '?name=' + name + '"> Click Here </a>';
    const data = {
        from: "Password Manager <me@sampes.mailgun.org>",
        to: email,
        subject: 'Password Reset',
        html: html
    };

    mailgun.messages().send(data, function(err, bod){
        console.log(bod);
    });
};
