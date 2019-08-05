const CT = require('../modules/country-list');
const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
const passport = require('passport');
const express = require('express');
let router = express.Router();
const authLimiter = require('../modules/authLimiter');
const UserValidator = require('../modules/user-validator');


router.get('/', function(req, res){
    // check if the user has an auto login key saved in a cookie //
    if(req.isAuthenticated && req.isAuthenticated()){
        return res.redirect('/account');
    }else{
        return res.render('index/login',{
            layout: 'minimal'
        });
    }
});

router.post('/',
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

router.get('/instagram', passport.authenticate('instagram') );

router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}) );

router.get('/facebook', passport.authenticate('facebook', { scope: ['email']}));

router.get('/instagram/callback',
    passport.authenticate('instagram', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/login/finalize');
    }
);

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res){
    res.redirect('/login/finalize');
});

router.get('/facebook/callback',
    passport.authenticate('facebook',{ failureRedirect: '/login' }),
    function(req, res){
        res.redirect('/login/finalize');
    }
);

router.get('/finalize', function(req, res){
    if(req.user.rank !== "social-new"){
        res.redirect('/account');
    } else {
        res.render('login/finalize_registration', {udata: req.user});
    }
});

router.post('/finalize', function(req, res){
    let userData = {
        username: req.body['username'],
        ref_by: req.body['ref_by'],
        email: req.body['email']
    };
    let validator = new UserValidator(userData,
        function(err){
            return res.status(401).send(err);
        },
        function(user){
            try{
                req.user.username = userData.username;
                req.user.ref_by = userData.ref_by;
                req.user.email = userData.email;
                req.user.rank = 'activated';
                req.user.save();
                res.status(200).send('ok');
            } catch(err){
                res.status(401).send(err);
            }
        });
    validator.validateSocial();
});

router.get('/unverified', function(req, res){
    if(req.user.rank !== "new"){
        res.rediect('/account');
    } else {
        res.render('login/unverified', {udata: req.user});
    }
});
module.exports = router;
