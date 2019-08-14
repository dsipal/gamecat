const express = require('express');
const User = require('../modules/User');
let router = express.Router();

router.get('/leaderboard', function(req, res){
    // User.find().sort([['points', -1]]).limit(10).exec(function(err,users){
    //     console.log(users);
    //     if(err){
    //         console.log(err);
    //     } else {
    //         res.render('leaderboards', {users: users});
    //     }
    //
    // })

    User.getAllRecords(function(err, users){
        if(err){
            console.log(err);
        } else {
            // console.log(users);
            res.render('leaderboards', {users: users, pageTitle: '- Login'});
        }
    });

});

module.exports = router;
