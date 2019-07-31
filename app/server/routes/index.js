const CT = require('../modules/country-list');
const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
const passport = require('passport');
const express = require('express');
let router = express.Router();
const authLimiter = require('../modules/authLimiter');
const UserValidator = require('../modules/user-validator');

router.get('/', function(req, res){
    return res.render('index/index', {udata: req.user});
});

router.get('/login', function(req, res){
    // check if the user has an auto login key saved in a cookie //
    if(req.isAuthenticated && req.isAuthenticated()){
        return res.redirect('/account');
    }else{
        return res.render('index/login',{
            layout: 'minimal'
        });
    }
});

router.post('/login',
    passport.authenticate('local', {
        session: true,
    }),
    async function(req, res){
        console.log(req.body['username'] + ' logging in.');
        await req.session.save();
        if (req.body['remember-me'] === 'false'){
            return res.redirect('/account');
        } else {
            //TODO *removed call to AM- moved function to User.js *
            await User.generateLoginKey(req.user.username, req.ip, function(key){
                res.cookie('login', key, { maxAge: 900000 });
                return res.redirect('/account');
            });

        }
    }
);

router.get('/login/auth/facebook/cback',
    passport.authenticate('facebook',{ failureRedirect: '/login' }),
    function(req, res){
        res.redirect('/');
    }
);

router.get('/login/auth/facebook',
    passport.authenticate('facebook'));

router.get('/logout', authLimiter.ensureAuthenticated(), function(req, res){
    console.log(req.username + ' logging out.');
    res.clearCookie('login');
    req.session.destroy(function(e){
        if(e) {
            console.log(e);
        } else {
            return res.redirect('/');
        }
    });
});

router.get('/signup', function(req, res) {
    if(req.isAuthenticated && req.isAuthenticated()){
        return res.redirect('/account');
    } else {
        return res.render('index/signup', {
            layout: 'minimal',
            title: 'Signup',
            countries : CT,
            ref_by: req.query.ref_by,
            email: req.query.email,
            agree: req.query.agree
        });
    }

});

router.post('/signup', function(req, res){
    if(req.isAuthenticated && req.isAuthenticated()){
        return res.redirect('/account');
    } else {
        console.log('Registration for ' + req.body['username']);
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
                return res.status(401).send(err);
            },
            function(user){
                User.formatNewAccount(user, function(err){
                    if(err){
                        console.log(err);
                        console.log(err.errors);
                        return res.status(401).send(err);
                    } else {
                        return res.status(200).send('ok');
                    }
                });
            }
        );
        validator.validate();
    }

});

router.post('/lost-password', async function(req, res){
    let resetEmail = req.body['email'];
    User.findOne({email:resetEmail}, async function(e, o) {
        if(e) {
            console.log('Problem with password reset' + req.query.name + '   ' + req.query.id);
        } else if(!o){
            console.log('Problem with password reset' + req.query.name + '   ' + req.query.id);
            return res.status(400).send('Reset email not sent, invalid email');
        } else{
            console.log('Sent password reset email to ' + o.username);
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
    await User.findOne({username:req.query.name}, function(e, o){
        if(e || !o){
            console.log('Invalid reset attempt for ' + req.query.name);
            return res.redirect('/');
        } else {
            if(o.token === req.query.id){
                console.log('Resetting password for ' + o.username);
                req.session.token = o.token;
                return res.render('index/reset', { title : 'Reset Password' });
            } else{
                console.log('Invalid reset token for ' + req.username);
                return res.status(400).send('Invalid Reset Token');
            }
        }
    });

});

router.post('/reset', authLimiter.ensureAuthenticated(), async function(req, res) {
    let newPass = req.body['pass'];
    let newToken = req.session.token;
    req.session.destroy();
    await User.findOne({token:newToken}, async function(e, o){
        if(o){
            await o.resetPassword(newPass, newToken,function(success){
                if(success){
                    console.log('Password reset complete for: ' + o.username);
                    return res.redirect('/');
                } else{
                    console.log('Password reset attempt failed.');
                    return res.sendStatus(500);
                }
            });
        } else {
            console.log('User not found for password reset.');
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

