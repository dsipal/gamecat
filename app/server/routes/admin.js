const CT = require('../modules/country-list');
const EM = require('../modules/email-dispatcher');
const User = require('../models/User');
const Prize = require('../models/Prize');
const rateLimit = require("express-rate-limit");
const passport = require('passport');
const express = require('express');
const authLimiter = require('../modules/authLimiter');
const router = express.Router();

router.get('/', authLimiter.ensureAuthenticated(), function(req, res){
    res.render('admin');
});

router.get('/users', authLimiter.ensureAuthenticated(), function(req, res){
    User.find().exec(function(err, users){
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

router.get('/cashouts', authLimiter.ensureAuthenticated(), function(req, res){

});

module.exports = router;