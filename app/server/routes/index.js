const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
const express = require('express');
let router = express.Router();
const authLimiter = require('../modules/authLimiter');
const Event =  require('../models/Event');
let Prize = require('../models/Prize');

router.get('/', async function(req, res){
    let modifierText=1;
    let prizes = await Prize.find({}).limit(8);
    Event.findOne({status: 'active'})
        .then(function(event){
            if(event){
                modifierText = (event.modifier+1);
            }
            if(req.user){
                return res.render('index/home', {udata: req.user, event: event, modifierText: modifierText, pageTitle: '- Home Page'});
            }else{
                return res.render('index/index', {udata: req.user, event: event, prizes: prizes, modifierText: modifierText, pageTitle: '- Rewards for Gamers'});
            }
        })
        .catch(function(err){
        console.log('Error Loading Main Page');
        console.log(err);
        return res.status(500).send(err);
    });

});

router.get('/logout', authLimiter.ensureAuthenticated(), function(req, res){
    console.log(req.username + ' logging out.');
    res.clearCookie('login');
    req.session.destroy(function(e){
        if(e) {
            console.log('Error logging out user: ' + req.user.username);
            console.log(e);
        } else {
            return res.redirect('/');
        }
    });
});

router.get('/signup', function(req, res) {
    if(req.isAuthenticated && req.isAuthenticated()){
        return res.redirect('/');
    } else {
        return res.render('index/signup', {
            title: 'Signup',
            ref_by: req.query.ref_by,
            email: req.query.email,
            agree: req.query.agree,
            pageTitle: '- Sign Up'
        });
    }
});

router.post('/signup', async function(req, res){

    if(req.isAuthenticated && req.isAuthenticated) {
        let userData = {
            username:   req.body['username'],
            password:   req.body['password'],
            passwordV:  req.body['password_verify'],
            email:      req.body['email'],
            ref_by:     req.body['ref_by'],
            email_optin: req.body['email_optin'] === 'true',
            terms_conditions: req.body['terms_conditions'] === 'true'
        };
        let newUser = await User.formatNewAccount(userData)
            .then(async function(userData){
                await User.addNewAccount(userData);
            })
            .then(function(user){
                return res.status(200).send('ok');
            })
            .catch(function(err){
                console.log('Error creating new account: ' + err);
                console.log(err.errors);
                return res.status(401).send(err);
            });


    } else {
        return res.redirect('/');
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
            let token = await o.updateToken();
            await EM.dispatchPasswordReset(resetEmail, token, o.username, function(err){
                if(!err){
                    return res.redirect('/');
                } else {
                    console.log('Error dispatching password reset email');
                    console.log(err);
                    return res.status(400).send('Error in dispatching email');
                }
            });
        }
    });
});

router.get('/reset', authLimiter.ensureAuthenticated(), async function(req, res) {
    let token = req.query.token;
    let username = req.query.username;
    console.log('Reset attempt by: ' + username + ' with token: ' + token);
    await User.findOne({username:username}, function(e, o){
        if(e || !o){
            console.log('Invalid reset attempt for ' + username);
            return res.redirect('/');
        } else {
            if(o.token === token){
                console.log('Resetting password for ' + o.username);
                req.session.token = o.token;
                return res.render('index/reset', { title : 'Reset Password' });
            } else{
                console.log('Invalid reset token for ' + o.username);
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
    return res.render('index/privacypolicy');
});

router.get('/tos', function(req, res){
    return res.render('index/tos');
});

router.get('/about', function(req, res){
    return res.render('index/about', {
        udata: req.user,
        pageTitle: '- About Us'
    });
});

router.get('/contact', function(req, res){
    return res.render('index/contact', {
        udata: req.user,
        pageTitle: '- Contact Us'
    });
});

router.post('/contact', function(req,res){
    let email = req.param('email');
    let category = req.param('category');
    let message = req.param('message');

    EM.dispatchSupport(email, category, message, function(){
        if(err){
            return res.redirect('/');
        } else {
            return res.redirect('/');
        }
    });
});


module.exports = router;

