//TODO set these in env vars for security.
const api_key = process.env.MG_KEY;
const domain = process.env.MG_DOMAIN;

const mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

//TODO set up email_optin list
const promolist = mailgun.lists('promotions@mg.gamecat.co');
const sitelist = mailgun.lists('sitenews@mg.gamecat.co');
const emailAcc = "Gamecat <admin@gamecat.co>";

exports.dispatchConfirm = function(email, token, name) {
    console.log(name, token);
    const data = {
        from: emailAcc,
        to: email,
        subject: 'Account Confirmation',
        template: 'newuser',
        "v:token": token,
        "v:username": name,
        "o:tag": ['confirmation']
    };

    mailgun.messages().send(data, function(err, bod){
        console.log(bod);
    });
};

exports.dispatchPasswordReset = function(email, token, name, callback){
    const data = {
        from: emailAcc,
        to: email,
        subject: 'Password Reset',
        template: 'passwordreset',
        "v:token": token,
        "v:username": name,
        "o:tag": ['passwordreset']
    };

    mailgun.messages().send(data, function(err, bod){
        if(err){
            callback(err);
        } else {
            callback(false);
            console.log(bod);
        }
    });
};

exports.dispatchSupport = async function(email, category, message, callback){
    let data = {
        from: email,
        to: 'support@mg.gamecat.co',
        template: 'supportrequest',
        'v:category': category,
        'v:message': message,
        'v:user': email
    };

    mailgun.messages().send(data, function(err, bod){
        if(err){
            callback(err);
        } else {
            callback(false);
        }
    })
};

exports.joinMailingList = function(email, name,optin) {

    let data = {
        address:    email,
        name:       name
    };

    sitelist.members().create(data, function(err, data){
        console.log('New Member On Mail List:');
        console.log(data);
    });

    if(optin){
        promolist.members().create(data, function(err, data){
            console.log('New Member On Mail List:');
            console.log(data);
        });
    }
};

