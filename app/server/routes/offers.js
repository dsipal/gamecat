const User = require('../models/User');
const authLimiter = require('../modules/authLimiter');
const express = require('express');
const router = express.Router();
const request = require('request-promise');
const Game = require('../models/Game');
const Event =  require('../models/Event');

router.get('/', authLimiter.ensureAuthenticated(), async function(req, res){
    let country_code = req.headers['cf-ipcountry'];
    const offers = await getOffers(country_code, req.user);

    let event = await Event.findOne({status: 'active'}).catch(function(err){
        console.log('Error fetching event.');
        console.log(err);
    });

    return res.render('offers/quests', {
        udata: req.user,
        offers: offers,
        event: event
    });
});

router.get('/surveys', authLimiter.ensureAuthenticated(), async function(req, res){
    let event = await Event.findOne({status: 'active'}).catch(function(err){
        console.log('Error fetching event.');
        console.log(err);
    });

    res.render('offers/offers', {
        udata: req.user,
        event: event
    });
});


router.get('/postback', async function(req, res){
    try{
        let source_id = req.query.subid1;
        let object_id = require('mongodb').ObjectId(req.query.subid2);
        let ip = req.headers['cf-connecting-ip'];
        let payout;

        if(source_id === 'gc'){
            //if postback is from PWN Games
            if(ip === '35.196.95.104' || ip === '35.196.169.46'){
                console.log('Postback from PWNGames received.');
                let offer_id = req.query.offer;
                let offer = await Game.find({'offer_ids': {$elemMatch: {'offer_id':offer_id}}});
                payout = offer.payout;
            }

            //if postback is from AdscendMedia
            else if(ip === '54.204.57.82'){
                console.log('Postback from AdscendMedia received.');
                payout = parseInt(req.query.payout);
            }

            //start payout process
            let user = await User.findOne({_id: object_id});
            let adjustedPayout = payout;

            //check for active events
            let event = await Event.findOne({status: 'active'}).catch(function(err){
                console.log('Error fetching event.');
                console.log(err);
            });
            //if active event add modifier to payout
            if(event){
                adjustedPayout += payout * event.modifier;
                console.log('Active event, adding ' + payout * event.modifier + ' points to payout');
            }

            //check, apply, and update daily bonus
            if(!user.daily_bonus_claimed){
                console.log(user.username + ' has claimed their daily bonus gaining ' + payout/2 + ' extra points.');
                adjustedPayout += payout/2;
                user.update({$set: {daily_bonus_claimed: true}}).exec();
            }


            //add in level bonus;
            adjustedPayout += Math.floor( payout * ((user.level-1) * 0.025));

            //add payout to user and give experience
            await user.addPoints(adjustedPayout);
            await user.addExperience(payout);

            console.log(user.username + " was paid " + adjustedPayout);
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

//get offers from PWNGames
async function getOffers(country_code, user){
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
        payouts.push(Math.floor(offer.payout + (offer.payout * (user.level * 0.025))));
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
        response.tracking_url += `?sub1=gc&sub2=${user._id}`;
        response.description = descriptions[key];
        response.name = names[key];
        response.payout = payouts[key];
    });

    return responses;
}

module.exports = router;
