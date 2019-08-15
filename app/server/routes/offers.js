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

    let modifierText=1;
    Event.findOne({status: 'active'})
        .then(function(event){
            if(event){
                modifierText = (event.modifier+1);
                offers.forEach(function(o){
                    o.payout += o.payout * event.modifier;
                });
            }

            return res.render('offers/quests', {
                udata: req.user,
                offers: offers,
                event: event,
                modifierText: modifierText,
                pageTitle: '- Quest Offers'
            });
        })
        .catch(function(err){
            console.log('Error fetching event.');
            console.log(err);
            return res.status(500).send(err);
        });


});

router.get('/surveys', authLimiter.ensureAuthenticated(), async function(req, res){
    let modifierText=1;
     Event.findOne({status: 'active'})
        .then(function(event){
            if(event){
                modifierText = (event.modifier+1);
            }
            res.render('offers/offers', {
                udata: req.user,
                event: event,
                modifierText: modifierText,
                pageTitle: '- Survey Offers'
            });
        })
        .catch(function(err){
            console.log('Error fetching event.');
            console.log(err);
            return res(500).send(err);
        });


});


router.get('/postback', async function(req, res){
    try{
        let source_id = req.query.subid1;
        let network = req.query.network;
        let object_id = require('mongodb').ObjectId(req.query.subid2);
        let ip = req.headers['cf-connecting-ip'];
        let payout;

        //check for correct sourceid
        if(source_id === 'gc'){
            if(network === 'pwn'){
                //if postback is from PWN Games
                console.log('Postback from PWNGames received.');
                let offer_id = req.query.offer;
                let offer = await Game.findOne(
                    {'offer_ids': {$elemMatch: {'offer_id':offer_id}}});
                payout = offer.payout;
            }
            else if(network === 'adscend') {
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

            if(!user.earned_referrer_points
                && (user.total_points_earned >= 800 || payout >= 800)
                && user.ref_by != null){
                //user was referred, got to 100 points, adding reward
                console.log(user.username + ' has reached 800 points! Percolating referral.');
                await user.percolateReferrals();
            }
            if(user.ref_by && user.earned_referrer_points) {
                //percolate 5% to referrer.

                let referrer = await User.findOne({_id: object_id});
                if(referrer){
                    console.log('User has referrer, adding 5% of payout to ' + referrer + ' totalling ' + (payout *.05) + ' crystals.');
                    referrer.addPoints((payout * 0.05)).catch(function(err){
                        console.log('Error adding points to referrer.');
                        console.log(err);
                    });
                }

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
    let conditions = [];

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
        payouts.push(Math.floor(offer.payout + (offer.payout * ((user.level-1) * 0.025))));
        conditions.push(offer.conditions);
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
        response.conditions = conditions[key];
    });

    return responses;
}

module.exports = router;
