const express = require('express');
const router = express.Router();
const Prize = require('../models/Prize');
const mongoose = require('mongoose');
const authLimiter = require('../modules/authLimiter');


router.get('/', function(req,res){
    Prize.find().exec(function(err, prizes){
        if(err){
            console.log(err);
            return res.sendStatus(500);
        } else {
            return res.render('shop/index',{
                prizes: prizes,
                udata: req.user,
                pageTitle: '- Rewards Page'
            });
        }
    })
});

//TODO make the pagetitles for prizes work
router.get('/:uri', async function(req, res){
    let uri = req.params.uri;
    try {
        let prize = await Prize.findOne({'uri': uri});
        let prizeTitle = ('- ' + prize.name + 's');
        return res.render('shop/prize', {
            prize: prize,
            udata: req.user,
            pageTitle: prizeTitle
        });
    } catch(err) {
        return res.render('404');
    }


});

router.post('/buy', authLimiter.ensureAuthenticated(), async function(req,res){
    let prizeID = mongoose.Types.ObjectId(req.body['product']);
    let option = parseInt(req.body['option']);

    await Prize.findOne({'_id': prizeID}).exec(async function(err, prize){
        if(err){
            console.log(err);
        } else {
            await req.user.purchasePrize(prize, option)
                .then(function(order){
                    if(order){
                        console.log(req.user.username + ' purchased ' + prize.name + ' for ' + option + ' crystals.');
                        return res.status(200).send('Order placed');
                    } else {
                        console.log('failure purchasing ' + prize.name + ' for ', req.user.username);
                        return res.status(500).send('Failure purchasing prize');
                    }
                })
        }
    });
});

module.exports = router;
