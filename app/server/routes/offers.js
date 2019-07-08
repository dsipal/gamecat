const User = require('../models/User');
const authLimiter = require('../modules/authLimiter');
const express = require('express');
const router = express.Router();
const geoip = require('geoip-country');
const request = require('request-promise');
const Game = require('../models/Game');



router.get('/', authLimiter.ensureAuthenticated(), async function(req, res){
    // let ip = req.headers['x-forwarded-for'] || req.ip;
    // if(ip.substr(0,7) === "::ffff:"){
    //     ip = ip.substr(7);
    // }


    let ip = "71.217.190.131";
    const geo = geoip.lookup(ip);
    let country_code;
    if(geo !== null){
        country_code = geo.country;
    }
    const offers = await getOffers(country_code, req.user._id);

    res.render('quests', {
        subid1: req.user._id,
        udata: req.user,
        offers: offers
    });
});

router.get('/surveys', authLimiter.ensureAuthenticated(), async function(req, res){
    res.render('offers', {
        subid1: req.user._id,
        udata: req.user,
    });
});


router.get('/postback', async function(req, res){
    //TODO *added ip restrictions to postback*, ensure that it works correctly with Adscend

    User.getByID().addPoints(req.query.payout*10);

    res.send(req.query.subid1 + " was paid " + 10 * req.query.payout);
});


async function getOffers(country_code, subid){
    const base_uri = 'https://api.eflow.team/v1/affiliates';
    let offer_ids = [];
    let descriptions = [];
    let names = [];

    let games = await Game.find({'offer_ids': {$elemMatch: {'country_codes': country_code}}});

    games.forEach((offer) => {
        const match = offer.offer_ids.find((offer_id) => {
            return offer_id.country_codes.indexOf(country_code) > -1;
        });
        offer_ids.push(match.offer_id);
        descriptions.push(offer.description);
        names.push(offer.name);
    });

    let promises = [];

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
    });

    return responses;
}

module.exports = router;
