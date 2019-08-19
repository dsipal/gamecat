const User = require('../models/User');
const passport = require('passport');
const express = require('express');
let router = express.Router();


router.get('/', function(req, res){
    // check if the user has an auto login key saved in a cookie //
    if(req.isAuthenticated && req.isAuthenticated()){
        return res.redirect('/');
    }else{
        return res.render('index/login', {pageTitle: '- Login Page'});
    }
});

router.post('/',
    passport.authenticate('local', {
        session: true,
    }),
    async function(req, res){
        let ip = req.headers['CF-Connecting-IP'];
        console.log(req.body['username'] + ' logging in.');
        await req.session.save();
        if (req.body['remember-me'] === 'false'){
            return res.redirect('/');
        } else {
            await User.generateLoginKey(req.user.username, ip, function(key){
                res.cookie('login', key, { maxAge: 900000 });
                return res.redirect('/');
            });

        }
    }
);

router.get('/instagram', passport.authenticate('instagram') );

router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}) );

router.get('/facebook', passport.authenticate('facebook', { scope: ['email']}));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }), function(req, res){
    return res.redirect('/login');
});

router.get('/facebook/callback',
    passport.authenticate('facebook',{ failureRedirect: '/login' }),
    function(req, res){
        return res.redirect('/login');
    }
);

router.get('/unverified', function(req, res){
    if(req.user.rank !== "new"){
        res.redirect('/');
    } else {
        res.render('login/unverified', {udata: req.user, pageTitle: '- New Account Redirect'});
    }
});
module.exports = router;
