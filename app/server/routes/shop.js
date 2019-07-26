const express = require('express');
const router = express.Router();
const Prize = require('../models/Prize');
const mongoose = require('mongoose');
const authLimiter = require('../modules/authLimiter');


router.get('/', function(req,res){
    Prize.find().exec(function(err, prizes){
        if(err){
            console.log(err)
        } else {
            res.render('shop/index',{
                prizes: prizes,
                udata: req.user
            });
        }
    })
});

router.get('/:uri', async function(req, res){
    let uri = req.params.uri;
    try {
        let prize = await Prize.findOne({'uri': uri});
        res.render('shop/prize', {
            prize: prize,
            udata: req.user
        });
    } catch(err) {
        res.render('404');
    }


});

router.post('/buy', authLimiter.ensureAuthenticated(), function(req,res){
    let prizeID = mongoose.Types.ObjectId(req.body['product']);
    let option = parseInt(req.body['option']);
    console.log(option);

    Prize.findOne({'_id': prizeID}).exec(function(err, prize){
        if(err){
            console.log(err);
        } else {
            req.user.purchasePrize(prize, option,function(order, user){
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
