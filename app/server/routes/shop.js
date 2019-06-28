const express = require('express');
const router = express.Router();
const Prize = require('../models/Prize');
const mongoose = require('mongoose');
const authLimiter = require('../modules/authLimiter');


router.get('/', authLimiter.ensureAuthenticated(),function(req,res){
    // Prize.create({
    // 	name: 'test',
    // 	image_path: '/img/vbucks.png',
    // 	description: 'test test test',
    // 	cost: 100,
    // 	categories: ['test', 'test2'],
    // 	tags: ['notatest'],
    //  num_purchased: 0,
    // }, function(e,o){
    // 	if(e){
    // 		console.log(e);
    // 	} else {
    // 		o.save();
    // 	}
    //
    // });

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
                    console.log('purchase successful');
                } else {
                    console.log('failure purchasing');
                }
            })
        }
    });
});

module.exports = router;
