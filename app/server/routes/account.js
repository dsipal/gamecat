const CT = require('../modules/country-list');
const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
let UserValidator = require('../modules/user-validator');
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

    return res.render('account/accountpage', {
        title: 'Control Panel',
        countries: CT,
        udata: populated_user
    });
});

router.post('/subscribe', authLimiter.ensureAuthenticated(), async function(req, res){
    try{

        req.user.email_optin = !req.user.email_optin;
        await req.user.save();

        return res.sendStatus(200);
    } catch(err) {
        return res.sendStatus(300);
    }

});

router.post('/logout', authLimiter.ensureAuthenticated(), function(req, res){
    res.clearCookie('login');
    req.session.destroy(function(e){
        if(e) {
            console.log(e);
            return res.sendStatus(500);
        } else {
            return res.status(200).send('ok');
        }
    });
});

router.post('/delete', function(req, res){
    //TODO ensure that deleting a user works correctly
    try{
        req.user.deleteAccount();
        return res.clearCookie('login');
    } catch(err) {
        return res.sendStatus(500);
    }

});

router.get('/verify', async function(req, res){
    //TODO ensure that verification through email works, limit pages that user can access without verification
    let name = req.query.name;
    let id = req.query.id;

    User.findOne({username:name, rank:'new'}, async function(e, o) {
        if(e) {
            console.log('Problem With Verification:' + name + '   ' + id);
            return res.redirect('/login');
        } else {
            console.log('verifying');
            await o.confirmAccount(id).then(function(success){
                if(success){
                    return res.redirect('/login');
                } else {
                    return res.redirect('/');
                }
            });
        }
    })
});

module.exports = router;
