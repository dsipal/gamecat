const CT = require('../modules/country-list');
const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
const rateLimit = require("express-rate-limit");
const passport = require('passport');
const express = require('express');
let router = express.Router();
const authLimiter = require('../modules/authLimiter');
const UserValidator = require('../modules/user-validator');

const accountCreateLimiter = rateLimit({
    windowMs: 60*60*1000 * 24, 		//3 Registrations per One Day
    max: 3,
    message:
        "Too many account created on this IP, try again in a day."
});

const genericLimiter = rateLimit({
    windowMs: 	1000, 				//2 Get/Posts per One Second
    max:		4,
    message:
        "Try again in a few seconds"
});

const passwordResetLimiter = rateLimit( {
    windowMs:   1000*60*60*24,
    max:        5,
    message:
        "Too many password resets in one day, please try tomorrow"
});

router.use('/', genericLimiter());

router.get('/', function(req, res){
    res.render('index/index', {udata: req.user});
});

router.get('/login', function(req, res){
    // check if the user has an auto login key saved in a cookie //
    console.log(req.isAuthenticated());
    if(req.isAuthenticated()){
        res.redirect('account');
    }else{
        if (req.cookies.login === undefined || !req.isAuthenticated()){
            res.render('index/login', {
                layout: 'minimal'
            });
        } else {
            // attempt automatic login //
            //TODO *removed call to AM for autoLogin and validateLoginKey*
            let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
            if(ip.substr(0,7) === "::ffff:"){
                ip = ip.substr(7);
            }
            User.validateLoginKey(req.cookies.login, ip, async function(e, o){
                if (o){
                    User.autoLogin(o.user, o.pass, function(o){
                        res.redirect('/account');
                    });
                } else {
                    res.render('index/login',{
                        layout: 'minimal'
                    });
                }
            });
        }
    }

});

router.post('/login',
    passport.authenticate('local', {
        session: true,
    }),
    function(req, res){
        req.session.save();
        if (req.body['remember-me'] === 'false'){
            res.redirect('/account');
        } else {
            //TODO *removed call to AM- moved function to User.js *
            User.generateLoginKey(req.user.username, req.ip, function(key){
                res.cookie('login', key, { maxAge: 900000 });
                res.redirect('/account');
            });

        }
    }
);

router.get('/logout', authLimiter.ensureAuthenticated(), function(req, res){
    res.clearCookie('login');
    req.session.destroy(function(e){
        if(e) {
            console.log(e);
        } else {
            res.redirect('/');
        }
    });
});

router.get('/signup', function(req, res) {
    res.render('index/signup', {
        layout: 'minimal',
        title: 'Signup',
        countries : CT,
        ref_by: req.query.ref_by,
        email: req.query.email,
        agree: req.query.agree
    });
});

router.post('/signup', accountCreateLimiter(), function(req, res){
    let userData = {
        username:   req.body['username'],
        password:   req.body['password'],
        passwordV:  req.body['password_verify'],
        email:      req.body['email'],
        ref_by:     req.body['ref_by'],
        email_optin: req.body['email_optin'] === 'true',
        terms_conditions: req.body['terms_conditions'] === 'true'

    };

    let validator = new UserValidator(
        userData,
        function(err){
            res.status(401).send(err);
        },
        function(user){
            User.formatNewAccount(user, function(err){
                if(err){
                    console.log(err);
                    console.log(err.errors);
                    res.status(401).send(err);
                } else {
                    res.status(200).send('ok');
                }
            });
        }
    );
    validator.validate();
});

router.post('/lost-password', passwordResetLimiter(), function(req, res){
    let resetEmail = req.body['email'];
    User.findOne({email:resetEmail}, function(e, o) {
        if(e) {
            console.log('Problem With Reset' + req.query.name + '   ' + req.query.id);
        } else if(!o){
            res.status(400).send('Reset email not sent, invalid email');
        } else{
            EM.dispatchPasswordReset(resetEmail, o.updateToken(), o.username, function(err){
                if(!err){
                    res.redirect('/');
                } else {
                    res.redirect('/');
                    res.status(400).send('Error in dispatching email');
                    console.log(err);
                }
            });
        }
    });
});

router.get('/reset', function(req, res) {
    console.log('Reset attempt by: ' + req.query.name + ' TOKEN: ' + req.query.id);
    User.findOne({username:req.query.name}, function(e, o){
        if(e || !o){
            res.redirect('/');
        } else {
            if(o.token === req.query.id){
                console.log('Valid Token');
                req.session.token = o.token;
                res.render('index/reset', { title : 'Reset Password' });
            } else{
                res.status(400).send('Invalid Reset Token');
            }
        }
    });

});

router.post('/reset', function(req, res) {
    let newPass = req.body['pass'];
    let newToken = req.session.token;
    req.session.destroy();
    User.findOne({token:newToken}, function(e, o){
        if(o){
            o.resetPassword(newPass, newToken,function(success){
                if(success){
                    console.log('Password Reset Complete for: ' + o.username);
                    res.redirect('/');
                } else{
                    console.log('Password Reset Failed');
                }
            });
        } else{
            console.log('Password Reset User Not Found');
        }
    });
});

router.get('/privacypolicy', function(req,res){
    res.render('index/privacypolicy');
});

router.get('/tos', function(req, res){
    res.render('index/tos');
});

router.get('/about', function(req, res){
    res.render('index/about');
});

router.get('/contact', function(req, res){
    res.render('index/contact');
});
router.post('/contact', function(req,res){
    let email = req.param('email');
    let category = req.param('category');
    let message = req.param('message');

    EM.dispatchSupport(email, category, message, function(err){
        if(err){
            res.redirect('/');
        } else {
            res.redirect('/');
        }
    })
});


module.exports = router;

