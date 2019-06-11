const mongoose = require('mongoose');
const crypto = require('crypto');

const user = new mongoose.Schema({
        username: String,
        password: String,
        name: String,
        email: String,
        country: String,
        referrals: [{
            type: String
        }],
        ref_by: String,
        reg_date: Date,
        points: Number,
        cookie: String,
        ip: String
    },
    {collection: 'Users'});

// login functions //
//takes plaintext password, returns plainPass == hashedPass
user.methods.validatePassword = function(plainPass){
    console.log(this.password);
    var salt = this.password.substr(0, 10);
    var validHash = salt + md5(plainPass + salt);
    console.log(validHash);
    return validHash === this.password;
};


// registration functions //

//takes in registration form data, callback is handled in routes.
//ensures that username & email are unique, and that referrer exists.
user.statics.addNewAccount = function(newData, callback){
    User.findOne({username:newData.username}, function(e, o) {
        if (o){
            callback('username-taken', null);
        }  {
            User.findOne({email:newData.email}, function(e, o) {
                if (o){
                    callback('email-taken', null);
                } else {
                    console.log(newData.ref_by);
                    User.findOne({username:newData.ref_by}, function(e, o) {
                        if (!o && !(newData.ref_by === "")){
                            callback('invalid-referral', null);
                        } else {
                            saltAndHash(newData.password, function(hash){

                                newData.password = hash;
                                newData.referrals = [];
                                // append date stamp when record was created //
                                newData.reg_date = new Date();
                                newData.points = 0;
                                User.create(newData, function(e,o){
                                    if(e) {
                                        callback(e, null);
                                    } else {
                                        callback(null, o);
                                    }
                                });
                            });
                        }
                    });
                }
            });
        }
    });
};

//used at end of registration, adds new user to referrer's list
user.methods.percolateReferrals = function () {
    User.updateOne({username:this.ref_by},
        {'$push': {referrals:this.username}},
        function(err, raw){
            if(err) console.log(err);
        });
};

// update account functions //
//used by postback, called in routes, adds points to user
user.methods.addPoints = function(amount){
    this.points += amount;
    this.save();
};

//updates password, called in routes
user.methods.updatePassword = function(newpass){
    this.password = newpass;
    this.save()
};

//updates user's info, called in routes
user.methods.updateAccount = function(data, callback){
    console.log(this.validatePassword(data.password));
    if(this.validatePassword(data.password)){
        this.name = data.name;
        this.email = data.email;
        this.country = data.country;
        this.save();
        callback(null, this);
    } else {
        console.log('error updating.');
        callback('invalid-password', null);
    }

};

// helper functions //
var md5 = function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
};

var generateSalt = function()
{
    var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ'; // should be stored in env variable.
    var salt = '';
    for (var i = 0; i < 10; i++) {
        var p = Math.floor(Math.random() * set.length);
        salt += set[p];
    }
    return salt;
};

var saltAndHash = function(pass, callback)
{
    var salt = generateSalt();
    callback(salt + md5(pass + salt));
};

const User = mongoose.model('User', user);
module.exports = User;
