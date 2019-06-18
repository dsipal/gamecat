const CT = require('../modules/country-list');
const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
const rateLimit = require("express-rate-limit");
const passport = require('passport');
const express = require('express');
let router = express.Router();
const authLimiter = require('../modules/authLimiter');


router.get('/', function(req, res){
    // check if the user has an auto login key saved in a cookie //
    if (req.cookies.login === undefined || !req.isAuthenticated()){
        res.render('login', {
            title: 'Hello - Please Login To Your Account'
        });
    } else {
        // attempt automatic login //
        //TODO *removed call to AM for autoLogin and validateLoginKey*
        User.validateLoginKey(req.cookies.login, req.ip, function(e, o){
            if (o){
                User.autoLogin(o.user, o.pass, function(o){
                    res.redirect('/account');
                });
            } else {

                res.render('login');
            }
        });
    }
});

router.post('/',
    passport.authenticate('local', {
        session: true,
        failureRedirect: '/'   //'/logout?status=login failed'
    }),
    function(req, res){
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

router.post('/logout', authLimiter.ensureAuthenticated(), function(req, res){
    res.clearCookie('login');
    req.session.destroy(function(e){
        if(e) {
            console.log(e);
        } else {
            res.status(200).send('ok');
        }
    });
});

router.get('/signup', function(req, res) {
    let ref_by = req.query.ref_by;
    res.render('signup', {
        title: 'Signup',
        countries : CT,
        ref_by: ref_by
    });
});

router.post('/signup', function(req, res){
    User.validateNewAccount({
        username:   req.body['username'],
        password:   req.body['password'],
        passwordV: req.body['password_verify'],
        name:       req.body['name'],
        email:      req.body['email'],
        country:    req.body['country'],
        ref_by:     req.body['ref_by'],
        email_optin: req.body['email_optin'] !== null,
        terms_conditions: req.body['terms_conditions'] !== null

    }, function(e, o) {
        console.log(e, o);
        if(e){
            res.status(400).send(e);
        } else {
            //res.redirect('/home');
            o.percolateReferrals();
            res.status(200).send('ok');
        }
    });
});

router.post('/lost-password', function(req, res){

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
                res.render('reset', { title : 'Reset Password' });
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

module.exports = router;
