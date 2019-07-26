const CT = require('../modules/country-list');
const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
let UserValidator = require('../modules/user-validator');
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

    res.render('account/accountpage', {
        title: 'Control Panel',
        countries: CT,
        udata: populated_user
    });
});

router.post('/subscribe', authLimiter.ensureAuthenticated(), function(req, res){
    try{

        req.user.email_optin = !req.user.email_optin;
        req.user.save();

        res.sendStatus(200);
    } catch(err) {
        res.sendStatus(300);
    }

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
    try{
        req.user.deleteAccount();
        res.clearCookie('login');
    } catch(err) {
        res.sendStatus(500);
    }

});

router.get('/verify', function(req, res){
    //TODO ensure that verification through email works, limit pages that user can access without verification
    User.findOne({username:req.query.name}, function(e, o) {
        if(e) {
            console.log('Problem With Verification' + req.query.name + '   ' + req.query.id);
        } else{
            console.log('verifying');
            o.confirmAccount(req.query.id, function(success){
                res.redirect('/login');
            });
        }
    })

});

module.exports = router;
