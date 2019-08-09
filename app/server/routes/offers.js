const User = require('../models/User');
const authLimiter = require('../modules/authLimiter');
const express = require('express');
const router = express.Router();
const request = require('request-promise');
const Game = require('../models/Game');

router.get('/', authLimiter.ensureAuthenticated(), async function(req, res){
    let country_code = req.headers['cf-ipcountry'];
    const offers = await getOffers(country_code, req.user._id);

    return res.render('offers/quests', {
        udata: req.user,
        offers: offers
    });
});

router.get('/surveys', authLimiter.ensureAuthenticated(), async function(req, res){
    res.render('offers/offers', {
        udata: req.user,
    });
});


router.get('/postback', async function(req, res){
    let source_id = req.query.subid1;
    let object_id = require('mongodb').ObjectId(req.query.subid2);
    let ip = req.headers['cf-connecting-ip'];
    let payout;

    try{
        if(source_id === 'gc'){
            //if postback is from PWN Games
            if(ip === '35.196.95.104' || ip === '35.196.169.46'){
                console.log('Postback from PWNGames recieved.');
                let offer_id = req.query.offer
                let offer = await Game.find({'offer_ids': {$elemMatch: {'offer_id':offer_id}}});
                payout = offer.payout;
            }
            //if postback is from AdscendMedia
            else if(ip === '54.204.57.82'){
                console.log('Postback from AdscendMedia revieved.');
                payout = parseInt(req.query.payout);
            }
            //find user and add points
            let user = await User.findOne({_id: object_id});
            user.points+= payout;
            await user.save();
            console.log(req.query.subid1 + " was paid " + req.query.payout);
            return res.status(200).send('Postback recieved.');
        } else {
            return res.status(200).send('Postback not for Gamecat.');
        }

    } catch(err) {
        console.log('Error with Postback.');
        console.log(err);
        return res.status(400).send('Invalid Postback');
    }
});

async function getOffers(country_code, subid){
    const base_uri = 'https://api.eflow.team/v1/affiliates';
    let offer_ids = [];
    let descriptions = [];
    let names = [];
    let payouts = [];

    //get games from the mongo db collection where there is a country code match
    let games = await Game.find({'offer_ids': {$elemMatch: {'country_codes': country_code}}});


    games.forEach((offer) => {
        //get the offerid that matches the country code
        const match = offer.offer_ids.find((offer_id) => {
            return offer_id.country_codes.indexOf(country_code) > -1;
        });
        //add offer id and info to list of offers to show
        offer_ids.push(match.offer_id);
        descriptions.push(offer.description);
        names.push(offer.name);
        payouts.push(offer.payout);
    });

    let promises = [];

    //pull the tracking url from pwngames api
    offer_ids.forEach(offer_id => {
        const endpoint = `/offers/${offer_id}`;
        promises.push(request({
            uri: base_uri+endpoint,
            headers: {
                'x-eflow-api-key': process.env.PWNGAMES_KEY
            },
            json: true
        }));
    });

    let responses = await Promise.all(promises);

    responses.map((response,key) => {
        response.tracking_url += `?subid1=gc&subid2=${subid}`;
        response.description = descriptions[key];
        response.name = names[key];
        response.payout = payouts[key];
    });

    return responses;
}

module.exports = router;
