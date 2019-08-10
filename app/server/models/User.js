const mongoose = require('mongoose');
const crypto = require('crypto');
const emdisp = require('../modules/email-dispatcher');
const Order = require('./Order');
const uniqueValidator = require('mongoose-unique-validator');

//TODO add validators in here, then handle the errors elsewhere.
const user = new mongoose.Schema({
        username: {
            type: String,
            unique: true,
            required: true
        },
        password: {
            type: String,
        },
        email: {
            type: String,
            unique: true,
        },
        orders: [{type: mongoose.Schema.ObjectId, ref: 'Order'}],
        awarded_prizes: [{type: mongoose.Schema.ObjectId, ref: 'Prize'}],
        referrals: [{type: mongoose.Schema.ObjectId, ref: 'User'}],
        ref_by: {type: mongoose.Schema.ObjectId, ref: 'User'},
        reg_date: {
            type: Date,
            required: true
        },
        points: Number,
        total_points_earned: Number,
        cookie: String,
        ip: String,
        rank: String,
        token: String,
        email_optin: Boolean,
        facebookID: String,
        googleID: String,
        daily_bonus_claimed: Boolean,
        current_level_experience: Number,
        level: Number,
    },
    {collection: 'Users'}
);
user.plugin(uniqueValidator);

user.statics.findOrCreate = async function(userData, callback) {
    User.findOne({email: userData.email}).then(function(user){
        if(user){
            console.log('User already exists for email: ' + userData.email);
            callback(null, user);
        } else {
            console.log('User not found for email: ' + userData.email + ' creating account.');
            User.formatNewAccount(userData, function(err, newUser){
                if(err){
                    console.log('Error formatting new account: ' + userData.username);
                    console.log(err);
                    callback(err, null);
                } else {
                    console.log('Created new user: ' + newUser);
                    callback(null, newUser);
                }
            });
        }
    }).catch(function(err){
        console.log(err);
        callback(err, null);
    });
};

// class/static functions //
user.statics.getAllRecords = function(callback){
    User.find().toArray(
        function(e, res) {
            if (e) callback(e);
            else callback(null, res)
        });
};

user.statics.generateLoginKey = function(username, ipAddress, callback){
    let cookie = guid();
    User.findOneAndUpdate({username:username}, {$set:{
            ip : ipAddress,
            cookie : cookie
        }}, {returnOriginal : false}, function(e, o){
        callback(cookie);});
};

// login functions //
//takes plaintext password, returns plainPass == hashedPass
user.methods.validatePassword = function(plainPass){
    let salt = this.password.substr(0, 10);
    let validHash = salt + md5(plainPass + salt);
    return validHash === this.password;
};

//takes in registration form data, callback is handled in routes.
//ensures that username & email are unique, and that referrer exists.
user.statics.formatNewAccount = function(newData, callback){
    if(newData.password) newData.password = saltAndHash(newData.password);
    if(!newData.googleID && !newData.facebookID) {
        newData.rank = 'new';
    } else {
        newData.rank = 'social-new';
        let tempNum = Math.floor(Math.random() * 1000);
        let tempUser = newData.username.replace(/\s/g, '');
        newData.username = tempUser + tempNum;
    }

    newData.reg_date = new Date();
    newData.points = 0;
    newData.total_points_earned = 0;
    newData.level = 1;
    newData.current_level_experience = 0;
    newData.daily_bonus_claimed = false;
    newData.token = crypto.randomBytes(20).toString('hex');

    if(newData.ref_by) {
        console.log('Populating ' + newData.ref_by +' as referrer for new user: ' + newData.username);
        User.findOne({username: newData.ref_by}).exec(function(err, user) {
            if(err) {
                console.log('Error populating the referrer for ' + newData.username);
                console.log(err);
                callback(err, null);
            } else {
                if(user !== null) {
                    newData.ref_by = user._id;
                    User.addNewAccount(newData, callback);
                } else {
                    console.log('Invalid referral for ' + newData.username);
                    callback(['invalid-referral'], null);
                }
            }
        });
    } else {
        console.log('Account ' + newData.username + ' formatted, creating new account.');
        User.addNewAccount(newData, callback);
    }
};

user.statics.addNewAccount  = function(newData, callback) {
    User.create(newData, function(e,o) {
        if(e) {
            console.log('Error creating new account: ' + newData.username);
            console.log(e);
            return callback(e, null);
        } else {
            console.log('Adding new account: ' + o.username);
            if(newData.rank === 'new') emdisp.dispatchConfirm(newData.email, newData.token, newData.username);
            return callback(null,o);
        }
    });
};

//Changing daily_bonus_claimed to false
user.statics.dailyBonusReset = function(){
    User.updateMany({daily_bonus_claimed: true},
        {$set: {daily_bonus_claimed: false}});
};

//used at end of registration, adds new user to referrer's list
user.methods.percolateReferrals = async function () {
    try{
        let ref_by = this.ref_by;
        let refID = this._id;

        if(ref_by !== null) {
            //add referral, points, and experience to referrer
            await User.updateOne(
                {_id: ref_by},
                {$push: {referrals: refID}, $inc: {points: 100, total_points_earned: 100, current_level_experience: 100}}
            ).catch(function(err){
                console.log('Error percolating to referrer');
                console.log(err);
            });
            //add referral, points, and experience to referred user
            await User.updateOne(
                {_id: refID},
                {$inc: {points: 100, total_points_earned: 100, current_level_experience: 100}}
            ).then(function() {
                console.log("Referrals percolated for " + this.username);
            }).catch(function(err){
                console.log('Error percolating to referred user');
                console.log(err);
            });
            return false;
        }
    } catch(err) {
        console.log('Error percolating referrals.');
        console.log(err);
        return err;
    }
};

// update account functions //
user.methods.deleteAccount = function() {
    this.delete();
};

user.methods.banAccount = async function() {
    await User.findOneAndUpdate(
        {_id: this._id},
        {$set: {rank: 'banned'}},
        { returnOriginal: false })
        .then(function(obj){
            console.log(obj.username + ' has been banned');
        })
        .catch(function(err){
            console.log("Error in banning : " + err);
        });
};

user.methods.checkLevelUp = async function(){
    let requiredExp = 600 + ((this.level-1) * 400);
    let reward =  ((this.level-1) * 40);
    if(this.level < 20 && this.current_level_experience >= requiredExp){
        console.log(this.username + ' has leveled up, gaining ' + reward + ' crystals');
        await User.findOneAndUpdate(
            {_id: this._id},
            {
                $inc: {level: 1, points: reward, current_level_experience: - requiredExp}
            }
        ).catch(function(err){
            console.log('Error leveling up user ' + this.username);
            console.log(err);
        });
    }
};

user.methods.addPoints = async function(amount){
    User.findOneAndUpdate(
        {_id: this._id},
        {
            $inc: {points: amount}
        }
    ).catch(function(err){
        console.log('Error adding points to user: ' + this.username);
        console.log(err);
    });
};

user.methods.addExperience = async function(amount){
    User.findOneAndUpdate(
        {_id: this._id},
        {
            $inc: {current_level_experience: amount}
        },
        {returnOriginal: false}
    ).then(function(user){
        user.checkLevelUp();
    }).catch(function(err){
        console.log('Error adding experience to user: ' + this.username);
        console.log(err);
    });
};

user.methods.unbanAccount = async function() {
    await User.findOneAndUpdate(
        {_id: this._id},
        {$set: {rank: 'activated'}},
        { returnOriginal: false })
        .then(function(obj){
            console.log(obj.username + ' has been unbanned');
        })
        .catch(function(err){
            console.log("Error in unbanning : " + err);
        })
};

//Checking if the token from URL matches token stored in user data, if yes, activate account
user.methods.confirmAccount = async function(token) {
    await User.updateOne(
        {_id: this._id },
        {$set: {rank: 'activated'}}
    ).catch(function(err){
        console.log('Error confirming user with token: ' + token);
        console.log(err);
        return err;
    });

    try{
        await emdisp.joinMailingList(this.email, this.name, this.email_optin);
        if(this.ref_by !== null){
            this.percolateReferrals();
        }
        return true;
    } catch(err){
        console.log('Error adding user to mailing list.');
        console.log(err);
        return(err);
    }
};

user.methods.updateToken = async function() {
    const newToken = crypto.randomBytes(20).toString('hex');
    User.findOneAndUpdate(
        {_id: this._id},
        {
            $set: {token: newToken}
        }
    ).catch(function(err){
        console.log('Error updating token for ' + this.username);
        console.log(err);
    });
    return newToken;
};

user.methods.resetPassword = async function(newPass, resetToken, callback){
    if(this.token === resetToken){
        //Temp storing password to maintain scopes
        let temp = '';
        saltAndHash(newPass, function(hash){
            temp = hash;
        });
        this.password = temp;
        await this.updateToken();
        return callback(true);
    } else {
        return callback(false);
    }
};

user.methods.updatePassword = async function(passKey, newPass, callback) {
    saltAndHash(newPass, async function(hash){
        newPass = hash;
        if(this.passKey === passKey){
            User.findOneAndUpdate(
                {_id: this._id},
                {
                    $set: {password: newPass}
                }
            );
            return callback(this);
        }
    });
};

// Shop Functions //
user.methods.purchasePrize = async function(prize, option, callback){
    let user = this;
    if(this.points >= option){
        this.points -= option;
        Order.collection.insertOne({
            prize: prize._id,
            option: option,
            user: this._id,
            status: 'pending',
            code:   null,
            order_date: new Date(),
        }).then(async function(order){
            user.orders.push(order.insertedId);
            await user.save(function(err){
                console.log('Error adding prize to user: ' + user.username);
                console.log(err);
            });
            return callback(order.ops[0], user);
        });
    } else {
        return callback(null, this)
    }
};

// Helper Functions //
function md5 (str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

function generateSalt() {
    let set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
    let salt = '';
    for (let i = 0; i < 10; i++) {
        let p = Math.floor(Math.random() * set.length);
        salt += set[p];
    }
    return salt;
}

function saltAndHash(pass) {
    let salt = generateSalt();
    //callback(salt + md5(pass + salt));

    return salt+md5(pass+salt);
}

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);
    });
}

const User = mongoose.model('User', user);
module.exports = User;
