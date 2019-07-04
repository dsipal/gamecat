const mongoose = require('mongoose');
const api_key = process.env.MG_KEY;
const domain = process.env.MG_DOMAIN;

const mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
const list = mailgun.lists('promotions@mg.gamecat.co');

const preuser = new mongoose.Schema({
    email: {type: String, unique: true}
}, {collection: 'preUsers'});

preuser.statics.createNew = function(email){
    console.log(email);
    let user = {address: email};
    list.members().create(user, function(err, data){
        let newEmail = {
            from: 'Gamecat <promotions@mg.gamecat.co>',
            to: email,
            subject: "Thanks for signing up!",
            template: "newUser"
        };
        mailgun.messages().send(newEmail);
    });
    preUser.create({email: email}, function(e, o){
        if(e) console.log(e);
    })
};

const preUser = mongoose.model('preUser', preuser);
module.exports = preUser;
