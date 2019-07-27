const CT = require('../modules/country-list');
const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
const Prize = require('../models/Prize');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const passport = require('passport');
const express = require('express');
const authLimiter = require('../modules/authLimiter');
const router = express.Router();

router.get('/', authLimiter.ensureAuthenticated(), function(req, res){
    res.render('admin/index');
});

router.get('/users', authLimiter.ensureAuthenticated(), function(req, res){
    User.find({rank:'activated'}).exec(function(err, users){
        if(err){
            console.log(err)
        } else {
            return res.render('admin/userlist',{
                users: users
            });
        }
    })
});

router.get('/users/banlist', authLimiter.ensureAuthenticated(), function(req, res){
    User.find({rank:'banned'}).exec( function(err, busers){
        if(err){
            console.log(err);
        } else {
            return res.render('admin/banlist', {
                users: busers
            });
        }
    });
});

router.post('/users/unban', authLimiter.ensureAuthenticated(), function(req, res){
    let username = req.body['/admin/unbanneduser'];

    User.findOne({username:username}).exec( async function(e, o) {
        if(e){
            console.log(e);
        } else {
            await o.unbanAccount();
        }
    }).catch(function(err){
        console.log('Error unbanning user: ' + username);
        console.log(err);
        return res.status(500).send('Error unbanning user: ' + username + '\n' +err);
    });

    return res.redirect('/admin/users');
});

router.post('/users/ban', authLimiter.ensureAuthenticated(), async function (req, res) {
    let username = req.body['user'];

    User.findOne({username:username}).then( function(e, o) {
        if(e){
            console.log(e);
        } else {
            o.banAccount();
        }
    }).catch(function(err){
        console.log('Error banning account: ' + username);
        console.log(err);
        return res.status(500).send('Error banning account: ' + username + '\n' +err);
    });

    return res.redirect('/admin/users');
});

router.get('/prizes', authLimiter.ensureAuthenticated(), async function(req, res){
    Prize.find().then(function(err, prizes){
        if(err){
            console.log(err);
            return res.sendStatus(500);
        } else {
            return res.render('admin/prizelist',{
                prizes: prizes
            });
        }
    }).catch(function(err){
        console.log('Error getting prizes.');
        console.log(err);
        return res.status(500).send('Error finding prizes: ' + '\n' +err);
    });
});

router.get('/prizes/newprize', authLimiter.ensureAuthenticated(), function(req, res){
    return res.render('admin/newprize');
});

router.post('/prizes/newprize', function(req, res){

});

router.get('/cashouts/pending', authLimiter.ensureAuthenticated(), async function(req, res){
    let orders = await Order.find({status: 'pending'})
        .populate('prize')
        .populate('user')
        .catch(function(err){
            console.log('Error querying the Order collection.');
            console.log(err);
            res.status(500).send('Error querying the Order collection.');
        });

    return res.render('admin/pendinglist', {
        orders: orders,
        udata: req.user
    });
});

router.get('/cashouts/complete', authLimiter.ensureAuthenticated(), async function(req, res){
    Order.find({ status: 'complete'}).then(function(err, prizes){
        if(err){
            console.log(err);
            return res.sendStatus(500);
        } else {
            return res.render('admin/completelist',{
                prizes: prizes
            });
        }
    }).catch(function(err){
        console.log('Error querying the order collection.');
        console.log(err);
        return res.status(500).send('Error querying the order collection. ' + '\n' + err);
    });
});

router.post('/cashouts/completed', authLimiter.ensureAuthenticated(), async function(req, res){
    let cashID = req.body['cashout'];

    Order.findOne({_id:cashID}).exec( async function(e, o) {
        if(e){
            console.log(e);
            return res.sendStatus(500);
        } else {
            await o.completeCashout();
            return res.redirect('/admin/cashouts/pending');
        }
    });
});

module.exports = router;
