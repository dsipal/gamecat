const mongoose = require('mongoose');
const crypto = require('crypto');
const emchecker = require('../modules/email-checker.js');
const emdisp = require('../modules/email-dispatcher');
const Prize = require('./Prize');
const Order = require('./Order');

//TODO add validators in here, then handle the errors elsewhere.
const user = new mongoose.Schema({
        username: {
            type: String,
            unique: true
        },
        password: String,
        name: String,
        email: {
            type: String,
            unique: true
        },
        orders: [{type: mongoose.Schema.ObjectId, ref: 'Orders'}],
        awarded_prizes: [{type: mongoose.Schema.ObjectId, ref: 'Prizes'}],
        country: String,
        referrals: [{
            type: String
        }],
        ref_by: String, // need to update this and all related functions to use [{type: mongoose.Schema.ObjectId, ref: 'Users'}],
        reg_date: Date,
        points: Number,
        cookie: String,
        ip: String,
        rank: String,
        token: String,
        email_optin: Boolean,
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
    console.log('deleted accounts');
};

user.statics.getByID = function(){
    return User.findOne({_id: getObjectId(id)});
};

user.statics.generateLoginKey = function(username, ipAddress, callback)
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
    console.log(plainPass);
    var salt = this.password.substr(0, 10);
    var validHash = salt + md5(plainPass + salt);
    console.log(validHash, this.password);
    return validHash === this.password;
};

// registration functions //
user.statics.validateNewAccount = function(newData, callback){
    console.log(newData);

    //TODO optimize these regexes to have min length as well.
    let userRegex = new RegExp(`^(?!.*__.*)(?!.*\\.\\..*)[a-z0-9_.]+$`);
    let passRegex = new RegExp(`\\S*(\\S*([a-zA-Z]\\S*[0-9])|([0-9]\\S*[a-zA-Z]))\\S*`);

    if(!newData.terms_conditions){
        callback('terms-not-accepted');
    }else{
        if(!userRegex.test(newData.username)){
            callback('invalid-username');
        }else{
            if(!passRegex.test(newData.password) || newData.password.length < 6 ){
                callback('invalid-password', null);
            }else{
                if(newData.password !== newData.passwordV){
                    callback('password-not-verified', null);
                }else{
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
                                            if(!emchecker.isBanned(newData.email)) {
                                                callback('disposable-email');
                                            } else {
                                                if (newData.username === newData.password){
                                                    callback('same-user-pass');
                                                } else {
                                                    User.addNewAccount(newData, callback);
                                                }
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        }
    }
};
//TODO clean addNewAccount, move verification into different function
//takes in registration form data, callback is handled in routes.
//ensures that username & email are unique, and that referrer exists.
user.statics.addNewAccount = function(newData, callback){
    saltAndHash(newData.password, function (hash) {

        newData.password = hash;
        newData.referrals = [];
        newData.reg_date = new Date();
        newData.points = 0;
        newData.rank = 'new';
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
};

//Moved from AM
user.statics.validateLoginKey = function(cookie, ipAddress, callback)
{
// ensure the cookie maps to the user's last recorded ip address //
    User.findOne({cookie:cookie, ip:ipAddress}, callback);
};

//Also from AM
user.statics.autoLogin = function(user, pass, callback)
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
    this.token = toke;
    this.save();
    return toke;
};

user.methods.resetPassword = function(newPass, resetToken, callback){
    if(this.token === resetToken){
        //Temp storing password to maintain scopes
        let temp = '';
        saltAndHash(newPass, function(hash){
            temp = hash;
        });
        this.password = temp;
        this.updateToken();
        callback(true);
    } else {
        callback(false);
    }
};

user.methods.updatePassword = function(passKey, newPass, callback)
{
    saltAndHash(newPass, function(hash){
        newPass = hash;
        if(this.passKey === passKey){
            this.password = newPass;
            this.passKey = '';
            this.save();
            callback(this);
        }
    });
};

// store functions //

user.methods.purchasePrize = function(prize, callback){
    let user = this;
    if(this.points >= prize.cost){
        console.log(this.points, prize.cost);
        this.points -= prize.cost;
        Order.collection.insertOne({
            prize: prize,
            user: this,
            status: 'Pending',
            order_date: new Date(),
        }).then(function(order){
            user.orders.push(order.insertedId);
            user.save(function(err){
                console.log(err);
            });
            callback(order.ops[0], user);
        });

    } else {
        callback(null, this)
    }
};


// helper functions //

const md5 = function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
};

const generateSalt = function()
{
    var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
    var salt = '';
    for (var i = 0; i < 10; i++) {
        var p = Math.floor(Math.random() * set.length);
        salt += set[p];
    }
    return salt;
};

const saltAndHash = function(pass, callback)
{
    var salt = generateSalt();
    callback(salt + md5(pass + salt));
};

const getObjectId = function(id)
{
    return new require('mongodb').ObjectID(id);
};



const User = mongoose.model('User', user);
module.exports = User;
