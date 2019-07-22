const express = require('express');
const preUser = require('../models/preUser');
let router = express.Router();

router.get('/', function(req, res){
    res.render('index/landing', {layout: 'minimal'});
});

router.post('/', function(req,res){
    let emailRegex  = RegExp(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

    if(emailRegex.test(req.body['email']) && req.body['agree'] === 'true'){
        preUser.createNew(req.body['email']);
        res.status(200).send('success')
    } else {
        res.status(400).send('error')
    }

});
module.exports = router;
