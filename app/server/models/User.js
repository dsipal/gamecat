const mongoose = require('mongoose');
const crypto = require('crypto');

const user = new mongoose.Schema({
    username: String,
    password: String,
    name: String,
    email: String,
    country: String,
    referrals: Array,
    ref_by: String,
    reg_date: Date,
    points: Number,
    cookie: String,
    ip: String,
    rank: String
});

user.methods.validatePassword = function(plainPass, hashedPass){
    var salt = hashedPass.substr(0, 10);
    var validHash = salt + md5(plainPass + salt);
    return validHash === hashedPass;
};

const User = mongoose.model('User', user);
module.exports = User;

var md5 = function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
};