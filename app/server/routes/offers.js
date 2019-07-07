const User = require('../models/User');
const authLimiter = require('../modules/authLimiter');
const express = require('express');
const router = express.Router();
const geoip = require('geoip-country');
const request = require('request-promise');



router.get('/', authLimiter.ensureAuthenticated(), async function(req, res){

    let ip = req.headers['x-forwarded-for'] || req.ip;
    if(ip.substr(0,7) === "::ffff:"){
        ip = ip.substr(7);
    }
    const geo = geoip.lookup(ip);
    let country_code;
    if(geo !== null){
        country_code = geo.country;
    }

    const pg_options = {
        uri: 'https://api.eflow.team/v1/affiliates/offersrunnable',
        headers: {
            'x-eflow-api-key': process.env.PWNGAMES_KEY
        }
    };

    request(pg_options).then(function(res){
        let offers = [];

        let data = JSON.parse(res);
        console.log(data.offers[0]);
        console.log(data.offers[0].relationship);
        // for(let offer in data.offers){
        //     for( country in offer.relationship.ruleset.countries){
        //         if(country_code === country.country_code){
        //             offers.push(offer);
        //         }
        //     }
        // }
        // console.log(offers[0]);

    }).catch(function(err){
        console.log(err);
    });


    res.render('offers', {
        subid1: req.user._id,
        udata: req.user
    })
});

router.get('/postback', async function(req, res){
    //TODO *added ip restrictions to postback*, ensure that it works correctly with Adscend

    User.getByID().addPoints(req.query.payout*10);

    res.send(req.query.subid1 + " was paid " + 10 * req.query.payout);
});

module.exports = router;
