const CT = require('../modules/country-list');
const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
const rateLimit = require("express-rate-limit");
const passport = require('passport');
const express = require('express');
const authLimiter = require('../modules/authLimiter');
const router = express.Router();

router.get('/', authLimiter.ensureAuthenticated(), async function(req, res) {

    let populated_user = await User.findOne({_id: req.user._id})
        .populate('ref_by', 'username')
        .populate('referrals')
        .populate({
            path: 'orders',
            populate: {path: 'prize'}
        });


    res.render('home', {
        title: 'Control Panel',
        countries: CT,
        udata: populated_user
    });
});

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

router.post('/delete', function(req, res){
    //TODO ensure that deleting a user works correctly
    req.user.deleteAccount();
    res.clearCookie('login');
});

router.get('/referrals', authLimiter.ensureAuthenticated(), async function(req, res) {
    let orders = await User.findOne({username: req.user.username})
        .populate({
            path: 'orders',
            populate: {
                path: 'prize user'
            }
    });
    console.log(orders.orders[0]);
        //TODO possibly add multi-tiered referrals
    var ref_link = req.protocol + '://' + req.headers.host + '/signup?ref_by=' + req.user.username;
    res.render('referrals', {ref_link: ref_link, referrals: req.user.referrals});

});

router.get('/verify', function(req, res){
    //TODO ensure that verification through email works, limit pages that user can access without verification
    User.findOne({username:req.query.name}, function(e, o) {
        if(e) {
            console.log('Problem With Verification' + req.query.name + '   ' + req.query.id);
        } else{
            o.confirmAccount(req.query.id, function(success){
                if(success){
                    res.redirect('/');
                } else {
                    res.redirect('/signup');
                }
            });
        }
    })
});

module.exports = router;
