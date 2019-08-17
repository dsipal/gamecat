const api_key = process.env.MG_KEY;
const domain = process.env.MG_DOMAIN;

const mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

//TODO set up email_optin list
const promolist = mailgun.lists('promotions@gamecat.co');
const sitelist = mailgun.lists('sitenews@gamecat.co');
const emailAcc = "Gamecat <admin@gamecat.co>";

exports.dispatchConfirm = async function(email, token, name) {
    const data = {
        from: emailAcc,
        to: email,
        subject: 'Account Confirmation',
        template: 'newuser',
        "v:token": token,
        "v:username": name,
        "o:tag": ['confirmation']
    };

    await mailgun.messages().send(data, function(err, bod){
        console.log(bod);
    });
};

exports.dispatchCode = async function(email, name, code, prize) {
    console.log("Preparing to send " + prize + " code to " + name + " at " + email);
    const data = {
        from: emailAcc,
        to: email,
        bcc: '3516abaf43@invite.trustpilot.com, gamecatgg@gmail.com',
        subject: 'Your Gamecat Reward Is Here!',
        template: 'sendprizecode',
        "v:username": name,
        "v:prizecode": code,
        "v:prizename": prize
    };

    await mailgun.messages().send(data, function(err, bod){
       console.log(bod);
    });
};

exports.dispatchPasswordReset = async function(email, token, name, callback){
    const data = {
        from: emailAcc,
        to: email,
        subject: 'Password Reset',
        template: 'passwordreset',
        "v:token": token,
        "v:username": name,
        "o:tag": ['passwordreset']
    };


    await mailgun.messages().send(data, function(err, bod) {
        if(err){
            console.log('Error dispatching password reset email: ');
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
        to: 'support@gamecat.co',
        subject: 'New support request',
        template: 'supportrequest',
        'v:category': category,
        'v:message': message,
        'v:email': email
    };

    mailgun.messages().send(data, function(err, bod) {
        if(err){
            console.log('Error dispatching support email: ');
            callback(err);
        } else {
            callback(false);
        }
    });
};

exports.joinMailingList = async function(email, name,optin) {

    let data = {
        address:    email,
        name:       name
    };

    await sitelist.members().create(data, function(err, data){
        console.log('New Member On Mail List:');
        console.log(data);
    });

    if(optin){
        await promolist.members().create(data, function(err, data){
            console.log('New Member On Mail List:');
            console.log(data);
        });
    }
};

