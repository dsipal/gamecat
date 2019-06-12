const api_key = '16ffd509-d3df6418';
const domain = 'sandboxf2ab2d4c9c19447ba48159645025e909.mailgun.org';

const mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

const list = mailgun.lists('mylist@mycompany.com');

// var EM = {};
// module.exports = EM;

exports.dispatchConfirm = function(email, token, name) {
    let data = {
        from: 'me@samples.mailgun.org>',
        to: email,
        subject: 'Account Confirmation',
        html: 'Confirmation Link: <a href="http://localhost:8080/verify?id=' + token + '?name=' + name + '"> Click Here</a>'
    };

    mailgun.messages().send(data, function(err, bod){
        console.log(bod);
    });
};

exports.joinMailingList = function(email, name) {
    let data = {
        address:    email,
        name:       name
    }

    list.members.create(data, function(err, data){
        console.log('New Member On Mail List:');
        console.log(data);
    });
};

// EM.server = require("emailjs/email").server.connect(
//     {
//         host 	    : process.env.NL_EMAIL_HOST || 'smtp.gmail.com',
//         user 	    : process.env.NL_EMAIL_USER || 'your-email-address@gmail.com',
//         password    : process.env.NL_EMAIL_PASS || '1234',
//         ssl		    : true
//     });
//
// EM.dispatchResetPasswordLink = function(account, callback)
// {
//     EM.server.send({
//         from         : process.env.NL_EMAIL_FROM || 'Node Login <do-not-reply@gmail.com>',
//         to           : account.email,
//         subject      : 'Password Reset',
//         text         : 'something went wrong... :(',
//         attachment   : EM.composeEmail(account)
//     }, callback );
// };
// EM.composeEmail = function(o)
// {
//     let baseurl = process.env.NL_SITE_URL || 'http://localhost:3000';
//     var html = "<html><body>";
//     html += "Hi "+o.name+",<br><br>";
//     html += "Your username is <b>"+o.user+"</b><br><br>";
//     html += "<a href='"+baseurl+'/reset-password?key='+o.passKey+"'>Click here to reset your password</a><br><br>";
//     html += "Cheers,<br>";
//     html += "<a href='https://braitsch.io'>braitsch</a><br><br>";
//     html += "</body></html>";
//     return [{data:html, alternative:true}];
// };
//
// EM.dispatchActivationLink = function(account, link, callback)
// {
// 	EM.server.send({
// 		from 					: process.env.NL_EMAIL_FROM,
// 		to 						: account.email,
// 		subject				: 'Account Activation',
// 		text 					: 'err',
// 		attachment		: EM.composeActivationEmail(account, link)
// 	}, callback );
// };
//
// EM.composeActivationEmail = function(o, l)
// {
// 	let baseurl = process.env.NL_SITE_URL || 'http://localhost:3000';
// 	var html = "<html><body>";
// 		html += "Welcome "+o.name+",<br><br>";
// 		html += "Thanks for making an account at WEBSITE! <br><br>"
// 		html += "<a href='"+link+"'>Click To Activate Your Account</a><br><br>";
// }
