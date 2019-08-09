const User = require('../models/User');
const authLimiter = require('../modules/authLimiter');
const express = require('express');
const router = express.Router();
const request = require('request-promise');
const Game = require('../models/Game');

router.get('/', authLimiter.ensureAuthenticated(), async function(req, res){
    let country_code = req.headers['cf-ipcountry'];
    const offers = await getOffers(country_code, req.user);

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
            //find user and add points
            let user = await User.findOne({_id: object_id});
            //add payout to user, adding in bonus per level, max bonus is 50% of payout.
            user.points += Math.floor(payout + payout * (user.level * 0.025));
            user.total_points_earned += payout;
            user.current_level_experience += payout;

            //calculate required exp for leveling up, base requirement is 600 (for first level)
            //and an additional 400 for each level past that
            let requiredExp = 600 + ((user.level-1) * 400);
            //check for level up, if user is not max level and has more than required exp to level up
            if(user.level < 20 && user.current_level_experience >= requiredExp){
                console.log(user.username + ' has leveled up to level ' + user.level + ', getting a bonus of ' + user.level*40);

                //give bonus reward for leveling up, max bonus is $2
                user.points += 40 * user.level;

                //subtract required exp and add level
                user.current_level_experience -= requiredExp;
                user.level += 1;
            }

            await user.save();
            console.log(user.username + " was paid " + payout);
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
