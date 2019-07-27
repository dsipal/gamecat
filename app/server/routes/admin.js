const CT = require('../modules/country-list');
const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
const Prize = require('../models/Prize');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const rateLimit = require("express-rate-limit");
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
    let banID = req.body['/admin/unbanneduser'];

    User.findOne({username:banID}).exec( function(e, o) {
        if(e){
            console.log(e);
        } else {
            o.unbanAccount();
        }
    });
    return res.redirect('/admin/users');
});

router.post('/users/ban', authLimiter.ensureAuthenticated(), async function (req, res) {
    let banID = req.body['user'];

    User.findOne({username:banID}).exec( function(e, o) {
        if(e){
            console.log(e);
        } else {
            o.banAccount();
        }
    });
    return res.redirect('/admin/users');
});

router.get('/prizes', authLimiter.ensureAuthenticated(), async function(req, res){
    Prize.find().exec(function(err, prizes){
        if(err){
            console.log(err);
            return res.sendStatus(500);
        } else {
            return res.render('admin/prizelist',{
                prizes: prizes
            });
        }
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
    let orders = await Order.find({status: 'complete'})
        .populate('prize')
        .populate('user')
        .catch(function(err){
            console.log('Error querying the Order collection.');
            console.log(err);
            res.status(500).send('Error querying the Order collection.');
        });

    return res.render('admin/completelist', {
        orders: orders,
        udata: req.user
    });
});

router.post('/cashouts/completed', authLimiter.ensureAuthenticated(), async function(req, res){
    let cashID = req.body['cashout'];
    let giftCode = req.body['code'];
    let name = req.body['name'];
    let email = req.body['email'];
    let prize = req.body['prize'];

    console.log(giftCode, name, email, prize);

    let order = await Order.findOne({_id:cashID, status:'pending'}).catch(function(err){
        console.log('Error querying the Order collection.');
        console.log(err);
        return res.status(500).send('Error querying the Order collection.');
    });

    if(order !== null || order !== undefined){
        console.log("order not null");
        await order.completeCashout(cashID, giftCode).then(async function(success){
            if(success){
               await EM.dispatchCode(email,name,giftCode,prize);
               return res.redirect('admin/cashouts/pending');
            } else{
               console.log("Unsuccessful in attempt to cashout " + prize);
               return res.redirect('admin/cashouts/pending');
            }
        });
    }

});

module.exports = router;
