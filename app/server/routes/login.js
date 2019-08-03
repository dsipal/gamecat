const CT = require('../modules/country-list');
const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
const passport = require('passport');
const express = require('express');
let router = express.Router();
const authLimiter = require('../modules/authLimiter');
const UserValidator = require('../modules/user-validator');

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
            await User.generateLoginKey(req.user.username, req.ip, function(key){
                res.cookie('login', key, { maxAge: 900000 });
                return res.redirect('/account');
            });

        }
    }
);

router.get('/login/instagram', passport.authenticate('instagram') );

router.get('/login/instagram/callback',
    passport.authenticate('instagram', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    }
);

router.get('/login/google', passport.authenticate('google', {scope: ['profile', 'email']}) );

router.get('/login/facebook', passport.authenticate('facebook', { scope: ['email']}));

router.get('/login/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res){
    res.redirect('/');
});

router.get('/login/facebook/callback',
    passport.authenticate('facebook',{ failureRedirect: '/login' }),
    function(req, res){
        res.redirect('/');
    }
);

router.get('/login/finalize', function(req, res){
    res.send('finalize_registration');
});
