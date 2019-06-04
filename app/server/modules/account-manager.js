const crypto = require('crypto');
const moment = require('moment');
const MongoClient = require('mongodb').MongoClient;
const User = require('../models/User');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
const emchecker = require('./email-checker.js');

var db;

mongoose.connect(process.env.DB_URL,{
    useNewUrlParser: true,
    useFindAndModify: false
}).then(function(o){
    db = o;
}).catch(function(e){
    console.log(e);
});


const guid = function(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});}

/*
	login validation methods
*/

exports.autoLogin = function(user, pass, callback)
{
    User.findOne({user:user}, function(e, o) {
        if (o){
            o.pass === pass ? callback(o) : callback(null);
        }	else{
            callback(null);
        }
    });
};

exports.manualLogin = function(username, password, callback)
{
    console.log(username, password);

    User.findOne({username:username}, function(e, o) {
        if (o == null){
            callback('user-not-found');
        }	else{
            validatePassword(password, o.password, function(err, res) {
                if (res){
                    callback(null, o);
                }	else{
                    callback('invalid-password');
                }
            });
        }
    });
};

exports.generateLoginKey = function(username, ipAddress, callback)
{
    let cookie = guid();
    User.findOneAndUpdate({username:username}, {$set:{
            ip : ipAddress,
            cookie : cookie
        }}, {returnOriginal : false}, function(e, o){
        callback(cookie);
    });
};

exports.validateLoginKey = function(cookie, ipAddress, callback)
{
// ensure the cookie maps to the user's last recorded ip address //
    User.findOne({cookie:cookie, ip:ipAddress}, callback);
};

exports.generatePasswordKey = function(email, ipAddress, callback)
{
    let passKey = guid();
    User.findOneAndUpdate({email:email}, {$set:{
            ip : ipAddress,
            passKey : passKey
        }, $unset:{cookie:''}}, {returnOriginal : false}, function(e, o){
        if (o.value != null){
            callback(null, o.value);
        }	else{
            callback(e || 'account not found');
        }
    });
};

exports.validatePasswordKey = function(passKey, ipAddress, callback)
{
    console.log(passkey, ipAddress);
// ensure the passKey maps to the user's last recorded ip address //
    User.findOne({passKey:passKey, ip:ipAddress}, callback);
};

/*
	record insertion, update & deletion methods
*/

exports.addPoints = function(subid, amount){
    console.log(subid,amount);

    User.findOneAndUpdate(
        {_id: getObjectId(subid)},
        {$inc: {points:amount}},
        {
            returnNewDocument: true
        });

};

exports.addNewAccount = function(newData, callback)
{
	User.findOne({username:newData.username}, function(e, o) {
		if (o){
			callback('username-taken');
		}	else{
			User.findOne({email:newData.email}, function(e, o) {
				if (o){
					callback('email-taken');
				}	else{
					console.log(newData.ref_by);
					User.findOne({username:newData.ref_by}, function(e, o) {
						if (!o && !(newData.ref_by === "")){
							callback('invalid-referral');
						} 	else{
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
                                            User.create(newData, callback);

                                            // add referral to person who referred user //
                                            percolateReferrals(newData.username, newData.ref_by);
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

percolateReferrals = function(username, ref_by) {
    User.updateOne({username:ref_by},
        {'$push': {referrals:username}},
        function(err, raw){
            if(err) console.log(err);
        });
};

exports.updateAccount = function(newData, callback)
{
    let findOneAndUpdate = function(data){
        var o = {
            name : data.name,
            email : data.email,
            country : data.country
        };
        if (data.password) o.password = data.password;
        User.findOneAndUpdate({_id:getObjectId(data.id)}, {$set:o}, {returnOriginal : false}, callback);
    };
    if (newData.pass === ''){
        findOneAndUpdate(newData);
    }	else {
        saltAndHash(newData.pass, function(hash){
            newData.pass = hash;
            findOneAndUpdate(newData);
        });
    }
};

exports.updatePassword = function(passKey, newPass, callback)
{
    saltAndHash(newPass, function(hash){
        newPass = hash;
        User.findOneAndUpdate({passKey:passKey}, {$set:{pass:newPass}, $unset:{passKey:''}}, {returnOriginal : false}, callback);
    });
};

/*
	account lookup methods
*/

exports.getAllRecords = function(callback)
{
    User.find().toArray(
        function(e, res) {
            if (e) callback(e);
            else callback(null, res)
        });
};

exports.deleteAccount = function(id, callback)
{
    User.deleteOne({_id: getObjectId(id)}, callback);
};

exports.deleteAllAccounts = function(callback)
{
    User.deleteMany({}, callback);
};

exports.getAccountByID = function(id){
    console.log(id);
    return User.findOne({_id: getObjectId(id)});
};

/*
	private encryption & validation methods
*/

var generateSalt = function()
{
    var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
    var salt = '';
    for (var i = 0; i < 10; i++) {
        var p = Math.floor(Math.random() * set.length);
        salt += set[p];
    }
    return salt;
};

var md5 = function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
};

var saltAndHash = function(pass, callback)
{
    var salt = generateSalt();
    callback(salt + md5(pass + salt));
};

exports.validatePassword = function(plainPass, hashedPass, callback)
{
    console.log(plainPass, hashedPass);
    var salt = hashedPass.substr(0, 10);
    var validHash = salt + md5(plainPass + salt);
    console.log(validHash, hashedPass);
    callback(null, hashedPass === validHash);
};

var getObjectId = function(id)
{
    return new require('mongodb').ObjectID(id);
};

var listIndexes = function()
{
    User.indexes(null, function(e, indexes){
        for (var i = 0; i < indexes.length; i++) console.log('index:', i, indexes[i]);
    });
};
