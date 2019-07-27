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
            console.log(err)
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
    Order.find({ status: 'pending'}).exec(function(err, orders){
        if(err){
            console.log(err);
            return res.sendStatus(500);
        } else {
            return res.render('admin/pendinglist',{
                orders: orders
            });
        }
    });
});

router.get('/cashouts/complete', authLimiter.ensureAuthenticated(), async function(req, res){
    Order.find({ status: 'complete'}).exec(function(err, prizes){
        if(err){
            console.log(err);
            return res.sendStatus(500);
        } else {
            return res.render('admin/completelist',{
                prizes: prizes
            });
        }
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
