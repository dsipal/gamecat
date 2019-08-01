//TODO clean up code in passport.js, capitalization and wording of text shown to user.
const LocalStrategy = require('passport-local').Strategy;
const GoogleOAuth = require('passport-google-oauth').OAuth2Strategy;
const FbStrategy = require('passport-facebook').Strategy;
const User = require('../server/models/User');

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
                return done('not-authenticated', null);
            }

            if(user.rank === 'new'){
                return done('not-verified', false);
            }

            if(user.validatePassword(password, user.password)){
                return done(null, user);
            }else{
                return done(err);
            }
        });
    }));

    passport.use(new GoogleOAuth({
            clientID: process.env.GOAUTH_ID,
            clientSecret: process.env.GOAUTH_SECRET,
            callbackURL: 'https://gamecat.co/login/google/callback',
        },
        function(accessToken, refreshToken, profile, done) {
            let userData = {
                username: profile.displayName,
                email: profile.emails[0].value,
                googleID: profile.id,
            };
            console.log(profile);
            User.findOrCreate(userData).then(function(user){
                return done(null, user);
            }).catch(function(err){
                console.log('Error with Google OAuth for ' + userData.username);
                console.log(err);
                return done(err);
            });
        })
    );

    passport.use(new FbStrategy({
        clientID: process.env.FBAUTH_ID,
        clientSecret: process.env.FBAUTH_SECRET,
        callbackURL: 'https://gamecat.co/login/facebook/callback',
        profileFields: ['email', 'displayName']
    },
    function(accessToken, refreshToken, profile, done) {
        console.log(profile);
        console.log(accessToken);
        console.log(refreshToken);
        User.findOne({
            'facebookID': profile.id
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            //No user was found... so create a new user with values from Facebook (all the profile. stuff)
            if (!user) {
                user = new User({
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    password: '420420',
                    facebookID: profile.id,
                    reg_date: new Date(),
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                //found user. Return
                return done(err, user);
            }
        });
    }
    ));

};
