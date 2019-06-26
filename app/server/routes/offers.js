const User = require('../models/User');
const authLimiter = require('../modules/authLimiter');
const express = require('express');
const router = express.Router();



router.get('/', authLimiter.ensureAuthenticated(), async function(req, res){
    //TODO get offer page working on single page, add different tabs for different types of offers
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
