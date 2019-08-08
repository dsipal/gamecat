const User = require('../models/User');
const authLimiter = require('../modules/authLimiter');
const express = require('express');
const router = express.Router();
const geoip = require('geoip-country');
const request = require('request-promise');
const Game = require('../models/Game');
const ipFormatter = require('../modules/ipFormatter');



router.get('/', authLimiter.ensureAuthenticated(), async function(req, res){
    let formattedIP = ipFormatter(req);
    let country_code = formattedIP[1].country;
    console.log(country_code);
    const offers = await getOffers(country_code, req.user._id);

    return res.render('offers/quests', {
        subid1: req.user._id,
        udata: req.user,
        offers: offers
    });
});

router.get('/surveys', authLimiter.ensureAuthenticated(), async function(req, res){
    res.render('offers/offers', {
        subid1: req.user._id,
        udata: req.user,
    });
});


router.get('/postback', async function(req, res){
    console.log('Postback from AdscendMedia revieved.');
    try{
        let subid = require('mongodb').ObjectId(req.query.subid1);
        let payout = parseInt(req.query.payout);

        let user = await User.findOne({_id: subid});
        user.points+= payout;
        await user.save();
        console.log(req.query.subid1 + " was paid " + req.query.payout);
        res.status(200).send('Postback recieved.');
    } catch(e){
        console.log('Error with AdscendMedia postback.');
        console.log(e);
        res.status(500).send('Invalid postback.');
    }

});

router.get('/pwnpostback', async function(req, res){
    console.log('pwn games postback recieved');
    try{
        let subid = require('mongodb').ObjectId(req.query.subid1);
        let offer = await Game.find({'offer_ids': {$elemMatch: {'offer_id': req.query.offer}}});
        let payout = offer.payout;

        let user = await User.findOne({_id: subid});
        user.points+= payout;
        await user.save();
        return res.status(200).send("Postback recieved.");
    }catch(e){
        console.log('Error with AdscendMedia postback.');
        console.log(e);
        res.status(500).send('Invalid postback.');
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
        response.tracking_url += `&subid1=${subid}`;
        response.description = descriptions[key];
        response.name = names[key];
        response.payout = payouts[key];
    });

    return responses;
}

module.exports = router;
