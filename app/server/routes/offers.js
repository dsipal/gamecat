const User = require('../models/User');
const authLimiter = require('../modules/authLimiter');
const express = require('express');
const router = express.Router();
const geoip = require('geoip-country');
const request = require('request-promise');
const Game = require('../models/Game');



router.get('/', authLimiter.ensureAuthenticated(), async function(req, res){
    let ip = req.headers['x-forwarded-for']
        || req.connection.remoteAddress
        || req.socket.remoteAddress
        || req.connection.socket.remoteAddress;

    if(ip.substr(0,7) === "::ffff:"){
        ip = ip.substr(7);
    }

    const geo = geoip.lookup(ip);
    let country_code;
    if(geo !== null){
        country_code = geo.country;
    }
    const offers = await getOffers(country_code, req.user._id);

    res.render('offers/quests', {
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
    let subid = require('mongodb').ObjectId(req.query.subid1);
    let payout = parseInt(req.query.payout);

    let user = await User.findOne({_id: subid});
    user.addPoints(payout);

    res.send(req.query.subid1 + " was paid " + req.query.payout);
});

router.get('/pwnpostback', async function(req, res){
    let subid = require('mongodb').ObjectId(req.query.subid1);
    let payout = parseInt(req.query.payout) * 40;

    let user = await User.findOne({_id: subid});
    user.addPoints(payout);
    res.send(req.query.subid1 + " was paid " + req.query.payout);
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
