const CT = require('../modules/country-list');
const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
const passport = require('passport');
const express = require('express');
let router = express.Router();
const authLimiter = require('../modules/authLimiter');
const UserValidator = require('../modules/user-validator');

router.get('/', function(req, res){
    res.render('index/index', {udata: req.user});
});

router.get('/login', function(req, res){
    // check if the user has an auto login key saved in a cookie //
    if(req.isAuthenticated()){
        res.redirect('/account');
    }else{
        res.render('index/login',{
            layout: 'minimal'
        });
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

router.post('/signup', function(req, res){
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

router.post('/lost-password', async function(req, res){
    let resetEmail = req.body['email'];
    User.findOne({email:resetEmail}, async function(e, o) {
        if(e) {
            console.log('Problem With Reset' + req.query.name + '   ' + req.query.id);
        } else if(!o){
            return res.status(400).send('Reset email not sent, invalid email');
        } else{
            await EM.dispatchPasswordReset(resetEmail, o.updateToken(), o.username, function(err){
                if(!err){
                    return res.redirect('/');
                } else {
                    console.log(err);
                    return res.status(400).send('Error in dispatching email');
                }
            });
        }
    });
});

router.get('/reset', authLimiter.ensureAuthenticated(), async function(req, res) {
    console.log('Reset attempt by: ' + req.query.name + ' TOKEN: ' + req.query.id);
    User.findOne({username:req.query.name}, function(e, o){
        if(e || !o){
            return res.redirect('/');
        } else {
            if(o.token === req.query.id){
                console.log('Valid Token');
                req.session.token = o.token;
                return res.render('index/reset', { title : 'Reset Password' });
            } else{
                return res.status(400).send('Invalid Reset Token');
            }
        }
    });

});

router.post('/reset', authLimiter.ensureAuthenticated(), async function(req, res) {
    let newPass = req.body['pass'];
    let newToken = req.session.token;
    req.session.destroy();
    User.findOne({token:newToken}, async function(e, o){
        if(o){
            await o.resetPassword(newPass, newToken,function(success){
                if(success){
                    console.log('Password Reset Complete for: ' + o.username);
                    return res.redirect('/');
                } else{
                    console.log('Password Reset Failed');
                    return res.sendStatus(500);
                }
            });
        } else {
            console.log('Password Reset User Not Found');
            return res.sendStatus(400);
        }
    });
});

router.get('/privacypolicy', function(req,res){
    return res.render('index/privacypolicy', {
        layout: 'minimal'
    });
});

router.get('/tos', function(req, res){
    return res.render('index/tos', {
        layout: 'minimal'
    });
});

router.get('/about', function(req, res){
    return res.render('index/about', {
        udata: req.user
    });
});

router.get('/contact', function(req, res){
    return res.render('index/contact', {
        udata: req.user
    });
});
router.post('/contact', function(req,res){
    let email = req.param('email');
    let category = req.param('category');
    let message = req.param('message');

    EM.dispatchSupport(email, category, message).then(function(err){
        if(err){
            return res.redirect('/');
        } else {
            return res.redirect('/');
        }
    })
});


module.exports = router;

