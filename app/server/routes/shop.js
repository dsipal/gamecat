const express = require('express');
const router = express.Router();
const Prize = require('../models/Prize');
const mongoose = require('mongoose');
const authLimiter = require('../modules/authLimiter');


router.get('/', authLimiter.ensureAuthenticated(),function(req,res){
    Prize.find().exec(function(err, prizes){
        if(err){
            console.log(err)
        } else {
            res.render('store',{
                prizes: prizes,
                udata: req.user
            });
        }
    })
});

router.post('/buy', authLimiter.ensureAuthenticated(),function(req,res){
    let prizeID = mongoose.Types.ObjectId(req.body['product']);

    Prize.findOne({'_id': prizeID}).exec(function(err, prize){
        if(err){
            console.log(err);
        } else {
            req.user.purchasePrize(prize, function(order, user){
                if(order){
                    res.redirect('/shop');
                } else {
                    console.log('failure purchasing for ', user);
                    res.redirect('/shop');

                }
            })
        }
    });
});

module.exports = router;
