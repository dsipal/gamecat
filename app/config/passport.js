var LocalStrategy = require('passport-local').Strategy;
var AM = require('../server/modules/account-manager');
var mongoose = require('mongoose');
var User = require('../server/models/User');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });


    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
    },  function(username, password, done){
        User.findOne({ username: username }, function(err, user) {
            if (err){
                return done(err, false);
            }

            if (!user){
                return done(null, false, { message: 'Incorrect Username'});
            }

            if(user.rank === 'new'){
                console.log('can not use new user');
                return done('user not activated yet, please use your activation email', false);
            }

            if(user.validatePassword(password, user.password)){
                return done(null, user);
            }else{
                return done(err);
            }


        });
    }));


};
