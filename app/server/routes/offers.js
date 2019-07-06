const User = require('../models/User');
const authLimiter = require('../modules/authLimiter');
const express = require('express');
const router = express.Router();
var geoip = require('geoip-country');



router.get('/', authLimiter.ensureAuthenticated(), async function(req, res){

    let ip = req.ip;
    if(ip.substr(0,7) === "::ffff:"){
        ip = ip.substr(7);
    }
    const geo = geoip.lookup('10.35.249.234');
    console.log(ip, geo);


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
