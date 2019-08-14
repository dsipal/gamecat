const User = require('../models/User');
const passport = require('passport');
const express = require('express');
let router = express.Router();


router.get('/', function(req, res){
    // check if the user has an auto login key saved in a cookie //
    if(req.isAuthenticated && req.isAuthenticated()){
        return res.redirect('/');
    }else{
        return res.render('index/login');
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
        res.redirect('/');
    } else {
        res.render('login/finalize_registration', {udata: req.user});
    }
});

router.post('/finalize', async function(req, res){
    let userData = {
        username: req.body['username'],
        ref_by: req.body['ref_by']
    };
    //probably should be in own function, checks if referrer and sets it if exists.
    if(userData.ref_by != ''){
        let referrer = await User.findOne({username: userData.ref_by}).exec().catch(function(err){
            console.log('Invalid referrer for ' + userData.username);
            console.log(err);
        });
        if(referrer){
            await User.findOneAndUpdate(
                {_id: req.user._id},
                {
                    "$set": {
                        "ref_by": referrer._id
                    }
                },
                {runValidators: true}
            ).exec().then(function(){
                console.log('Set referrer for ' + userData.username);
            }).catch(function(err){
                console.log('Error setting referrer for ' + userData.username);
                console.log(err);
                return res.status(401).send('Invalid Referrer');
            });
        }
    }

    //base for update user
    let updateData = {rank: 'activated'};
    if(req.user.username !== userData.username) updateData.username = userData.username;
    User.findOneAndUpdate(
        {_id: req.user._id},
        updateData,
        {runValidators: true}
    ).exec().then(function(){
        console.log('Finalized social account ' + userData.username);
        return res.status(200).send('ok');
    }).catch(function(err){
        console.log('Error finalizing social account ' + userData.username);
        console.log(err);
        return res.status(401).send(err);
    });
});

router.get('/unverified', function(req, res){
    if(req.user.rank !== "new"){
        res.redirect('/');
    } else {
        res.render('login/unverified', {udata: req.user});
    }
});
module.exports = router;
