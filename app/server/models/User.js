var mongoose = require('mongoose');

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
    activated: Boolean
});

const User = mongoose.model('User', user);
module.exports = User;
