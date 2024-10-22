const User = require('../models/User');
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
        }).catch(function(err){
            console.log('Error getting user info for: ' + req.user.username);
            console.log(err);
        });

    return res.render('account/accountpage', {
        title: 'Control Panel',
        udata: populated_user,
        pageTitle: '- Account Information'
    });
});

router.post('/subscribe', authLimiter.ensureAuthenticated(), async function(req, res){
    User.updateOne(
        {_id: req.user._id},
        {$set: {email_optin: true}}
    ).then(function(){
        return res.status(200).send('Email opt-in updated.')
        }).catch(function(err){
            console.log('Error updating email optin.');
            console.log(err);
            return res.status(500).send('Error updating email optin. ' + err);
    });
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
        return res.status(500).send('Error deleting user');
    }

});

router.get('/verify', async function(req, res){
    let name = req.query.username;
    let token = req.query.token;

    if(name !== undefined && token !== undefined){
        console.log('Attempting verification for ' + name + ' with token ' + token);
        let user = await User.findOne({username:name, rank:'new'}).catch(function(err){
            console.log('Cannot find user: ' + name);
            console.log('Error: ' + err);
            return res.status(500).send('Invalid username or ID.');
        });

        console.log('About to confirm account for: ');
        console.log(user);

        if(user !== null){
            console.log('User found, attempting verification.');
            user.confirmAccount(token).then(function(err){
                if(err === 'success'){
                    console.log('Verification success');
                    return res.redirect('/login');
                } else {
                    console.log('Error in verifying: ' + err);
                    return res.redirect('/');
                }
            });
        } else {
            return res.redirect('/login');
        }
    } else {
        return res.status(500).send('Invalid username or ID.');
    }
});

module.exports = router;
