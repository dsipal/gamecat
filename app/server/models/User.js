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
            required: [true, "A username is required."],
            validate: {
                validator: function(value){
                    return RegExp(`^(?=.{3,16}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$`).test(value);
                },
                message: 'Usernames can not contain symbols or spaces, and must be 3-16 characters.',
            }
        },
        password: {
            type: String,
            //validation for password can't be done here as it is hashed first
            //possibly could implement something like this https://stackoverflow.com/questions/14588032/mongoose-password-hashing
        },
        email: {
            type: String,
            unique: true,
            required: [true, 'A proper email address is required'],
            validate: {
                validator: function(value){
                    return RegExp(`^([\\w\\-\\.]+)@((\\[([0-9]{1,3}\\.){3}[0-9]{1,3}\\])|(([\\w\\-]+\\.)+)([a-zA-Z]{2,4}))$`).test(value);
                },
                message: 'A proper email address is required.'
            }
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
        earned_referrer_points: Boolean,
        current_level_experience: Number,
        level: Number,
    },
    {collection: 'Users'}
);

//adds actual validation error to unique keys
user.plugin(uniqueValidator);

user.statics.findOrCreate = async function(userData) {
    return new Promise(async function(resolve, reject){
        let user = await User.findOne({email: userData.email})
            .then(async function(user){
                if(user){
                    console.log('User already exists for email: ' + userData.email);
                    resolve(user);
                } else {
                    console.log('User not found for email: ' + userData.email + ' creating account.');
                    await User.formatNewAccount(userData)
                        .then(function(userData){
                            console.log('Formatted new user: ' + userData.username);
                            return User.addNewAccount(userData);
                        })
                        .then(function(newUser){
                            console.log('Created new user: ' + newUser.username);
                            resolve(newUser);
                        })
                        .catch(function(err){
                            console.log('Error creating or finding new account: ' + userData.username);
                            console.log(err);
                            reject(err);
                        });
                }
            })
            .catch(function(err){
            console.log(err);
            reject(err, null);
        });
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
user.statics.formatNewAccount = async function(newData){
    if(newData.password) newData.password = saltAndHash(newData.password);
    if(!newData.googleID && !newData.facebookID) {
        newData.rank = 'new';
    } else {
        newData.rank = 'activated';
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
    newData.earned_referrer_points = false;
    newData.token = crypto.randomBytes(20).toString('hex');
    if(newData.ref_by === '') newData.ref_by = undefined;

    if(newData.ref_by) {
        console.log('Populating ' + newData.ref_by +' as referrer for new user: ' + newData.username);
        console.log(newData.ref_by);
        await User.populateReferrer(newData);
    }
    return Promise.resolve(newData);
};

user.statics.populateReferrer = async function(newData) {
    console.log('Populating ' + newData.ref_by +' as referrer for new user: ' + newData.username);
    return new Promise(async function(resolve, reject){
        let referrer = await User.findOne({username: newData.ref_by});
        if(referrer != null) {
            newData.ref_by = referrer._id;
            resolve(newData);
        } else {
            console.log('Invalid referrer');
            reject('Invalid Referrer');
        }
    });
};


user.statics.addNewAccount  = async function(newData) {
    console.log('Creating new account: ' + newData.username);

    return new Promise(function(resolve, reject) {
        User.create(newData, function (err, user) {
            if (err) {
                console.log('Error creating user');
                console.log(err);
                reject(err);
            } else {
                console.log('Adding new account: ' + user.username);
                if (newData.rank === 'new') emdisp.dispatchConfirm(user.email, user.token, user.username);
                resolve(user);
            }
        })
    });
};

//Changing daily_bonus_claimed to false
user.statics.dailyBonusReset = function(){
    User.updateMany({daily_bonus_claimed: true},
        {$set: {daily_bonus_claimed: false}});
};

//used at end of registration, adds new user to referrer's list
user.methods.percolateReferrals = async function () {
    let ref_bonus = 500;
    if(this.ref_by !== null) {
        //add referral, points, and experience to referrer
        User.updateOne(
            {_id: this.ref_by},
            {
                $push: {referrals: this._id},
                $inc: {
                    points: ref_bonus,
                    total_points_earned: ref_bonus,
                    current_level_experience: ref_bonus
                }
            }
        ).catch(function(err){
            console.log('Error percolating to referrer');
            console.log(err);
            throw new Error('Invalid Referrer');
        });
        //add referral, points, and experience to referred user
        User.updateOne(
            {_id: this._id},
            {
                $inc: {
                    points: ref_bonus,
                    total_points_earned: ref_bonus,
                    current_level_experience: 100
                },
                $set: {earned_referrer_points: true}
            }
        ).then(function() {
            console.log("Referrals percolated, checking for level up");
        }).catch(function(err){
            console.log('Error percolating to referred user');
            console.log(err);
            throw new Error('Invalid Referrer');
        });
        return user;
    } else {
        throw new Error('No Referrer');
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
            console.log('Error leveling up user.');
            console.log(err);
        });
    }
};

user.methods.addPoints = async function(amount){
    User.findOneAndUpdate(
        {_id: this._id},
        {
            $inc: {points: amount, total_points_earned: amount}
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
        {token: token },
        {$set: {rank: 'activated'}}
    ).catch(function(err){
        console.log('Error confirming user with token: ' + token);
        console.log(err);
        return err;
    });

    console.log('Resetting token');
    await this.updateToken();

    try{
        await emdisp.joinMailingList(this.email, this.name, this.email_optin);
        return 'success';
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
user.methods.purchasePrize = async function(prize, option){
    if(this.points >= option){
        this.points -= option;

        //insert new order into order collection
        let order = await Order.collection.insertOne({
            prize: prize._id,
            option: option,
            user: this._id,
            status: 'pending',
            code:   null,
            order_date: new Date(),
        }).catch(function(err){
            console.log('Error adding new order to order collection.');
            console.log(err);
        });

        //add reference to order in user
        await User.findOneAndUpdate(
            {_id: this._id},
            {
                $push: {
                    orders: order.ops[0]._id
                },
                $inc: {
                    points: -option
                }
            }).catch(function(err){
            console.log('Error adding reference to order in user.');
            console.log(err);
        });
        return order.ops[0];
    } else {
        //user did not have enough points to purchase prize.
        return null;
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
