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
    res.render('admin');
});

router.get('/users', authLimiter.ensureAuthenticated(), function(req, res){
    User.find({rank:'activated'}).exec(function(err, users){
        if(err){
            console.log(err)
        } else {
            res.render('userlist',{
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
           res.render('banlist', {
                users: busers
           });
       }
    });
});

router.post('/users/unban', authLimiter.ensureAuthenticated(), function(req, res){
    let banID = req.body['unbanneduser'];

    User.findOne({username:banID}).exec( function(e, o) {
        if(e){
            console.log(e);
        } else {
            o.unbanAccount();
        }
    });
    res.redirect('/admin/users');
});

router.post('/users/ban', authLimiter.ensureAuthenticated(), function (req, res) {
    let banID = req.body['banneduser'];

    User.findOne({username:banID}).exec( function(e, o) {
        if(e){
            console.log(e);
        } else {
            o.banAccount();
        }
    });
    res.redirect('/admin/users');
});

router.get('/prizes', authLimiter.ensureAuthenticated(), function(req, res){
    Prize.find().exec(function(err, prizes){
        if(err){
            console.log(err)
        } else {
            res.render('prizelist',{
                prizes: prizes
            });
        }
    });
});

router.post('/prizes', function(req, res){

});

router.get('/cashouts/pending', authLimiter.ensureAuthenticated(), function(req, res){
    Order.find({ status: 'pending'}).exec(function(err, prizes){
        if(err){
            console.log(err)
        } else {
            res.render('pendinglist',{
                prizes: prizes
            });
        }
    });
});

router.get('/cashouts/complete', authLimiter.ensureAuthenticated(), function(req, res){
    Order.find({ status: 'complete'}).exec(function(err, prizes){
        if(err){
            console.log(err)
        } else {
            res.render('completelist',{
                prizes: prizes
            });
        }
    });
});

module.exports = router;