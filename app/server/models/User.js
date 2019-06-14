const mongoose = require('mongoose');
const crypto = require('crypto');
const emchecker = require('../modules/email-checker.js');
const emdisp = require('../modules/email-dispatcher');

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
        ip: String,
        rank: String,
        token: String,
        email_optin: Boolean
    },
    {collection: 'Users'});

const guid = function(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});}


// class/static functions //

user.statics.getAllRecords = function(callback){
    User.find().toArray(
        function(e, res) {
            if (e) callback(e);
            else callback(null, res)
        });
};

user.statics.deleteAllAccounts = function(){
    User.deleteMany({});
};

user.statics.getByID = function(){
    return User.findOne({_id: getObjectId(id)});
};

user.methods.generateLoginKey = function(username, ipAddress, callback)
{
    let cookie = guid();
    User.findOneAndUpdate({username:username}, {$set:{
            ip : ipAddress,
            cookie : cookie
        }}, {returnOriginal : false}, function(e, o){
        callback(cookie);
    });
};

// login functions //

//TODO possibly figure out how to auth without sending plaintext pass
//takes plaintext password, returns plainPass == hashedPass
user.methods.validatePassword = function(plainPass){
    console.log(this.password);
    var salt = this.password.substr(0, 10);
    var validHash = salt + md5(plainPass + salt);
    console.log(validHash);
    return validHash === this.password;
};

// registration functions //

//TODO clean addNewAccount, move verification into different function
//takes in registration form data, callback is handled in routes.
//ensures that username & email are unique, and that referrer exists.
user.statics.addNewAccount = function(newData, callback){
    User.findOne({username:newData.username}, function(e, o) {
        if (o){
            callback('username-taken', null);
        } else {
            User.findOne({email:newData.email}, function(e, o) {
                if (o){
                    callback('email-taken', null);
                } else {
                    console.log(newData.ref_by);
                    User.findOne({username:newData.ref_by}, function(e, o) {
                        if (!o && !(newData.ref_by === "")){
                            callback('invalid-referral', null);
                        } else{
                            if(emchecker.checkBannedEmails(newData.email)) {
                                if (newData.username === newData.password){
                                    callback('same-user-pass');
                                } else {
                                    saltAndHash(newData.password, function (hash) {

                                        newData.password = hash;
                                        newData.referrals = [];
                                        // append date stamp when record was created //
                                        newData.reg_date = new Date();
                                        newData.points = 0;
                                        newData.rank = 'new';
                                        newData.mailing = true;
                                        newData.token = crypto.randomBytes(20).toString('hex');

                                        emdisp.dispatchConfirm(newData.email, newData.token, newData.username);

                                        User.create(newData, function(e,o){
                                            if(e) {
                                                callback(e, null);
                                            } else {
                                                callback(null, o);
                                            }
                                        });
                                    })
                                }
                            } else {
                                callback('disposable-email');
                            }
                        }
                    });
                }
            });
        }
    });
};

//Moved from AM
user.methods.validateLoginKey = function(cookie, ipAddress, callback)
{
// ensure the cookie maps to the user's last recorded ip address //
    User.findOne({cookie:cookie, ip:ipAddress}, callback);
};

//Also from AM
user.methods.autoLogin = function(user, pass, callback)
{
    User.findOne({user:user}, function(e, o) {
        if (o){
            o.pass === pass ? callback(o) : callback(null);
        }	else{
            callback(null);
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

user.methods.deleteAccount = function(){
    this.delete();
};


//Checking if the token from URL matches token stored in user data, if yes, activate account
user.methods.confirmAccount = function(idToken, callback){
    if(this.token === idToken){
        this.rank = 'activated';
        this.save();
        if(this.email_optin){
            emdisp.joinMailingList(this.email, this.name);
        }
        callback(true);
    } else {
        callback(false);
    }
};

user.methods.updateToken = function(){
    const toke = crypto.randomBytes(20).toString('hex');
    user.token = toke;
    return toke;
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

var getObjectId = function(id)
{
    return new require('mongodb').ObjectID(id);
};

const User = mongoose.model('User', user);
module.exports = User;
