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
                console.log('Error logging in local user.');
                return done(err);
            }
        });
    }));

    passport.use(new GoogleOAuth({
            clientID: process.env.GOAUTH_ID,
            clientSecret: process.env.GOAUTH_SECRET,
            callbackURL: process.env.ROOT_URL + '/login/google/callback',
            passReqToCallback: true,
        },
        async function(req, accessToken, refreshToken, profile, done) {
            console.log(profile);
            let userData = {
                username: profile.displayName,
                email: profile.emails[0].value,
                googleID: profile.id,
            };
            let user = await User.findOrCreate(userData)
                .catch(function(err){
                    console.log('Error finding or creating Google user.');
                    console.log(err);
                    return done(err);
                });
            if(user){
                return done(null, user);
            } else {
                return done(null, new Error('no user'));
            }

        })
    );

    passport.use(new FbStrategy({
            clientID: process.env.FBAUTH_ID,
            clientSecret: process.env.FBAUTH_SECRET,
            callbackURL: process.env.ROOT_URL + '/login/facebook/callback',
            profileFields: ['email', 'displayName']
        },
        async function(accessToken, refreshToken, profile, done) {

            console.log(profile);
            let userData = {
                username: profile.displayName,
                email: profile.emails[0].value,
                facebookID: profile.id,
            };
            User.findOrCreate(userData)
                .catch(function(err){
                    console.log('Error finding or creating Facebook user.');
                    console.log(err);
                    return done(err);
                });
            let user = await User.findOrCreate(userData)
                .catch(function(err){
                    console.log('Error finding or creating Google user.');
                    console.log(err);
                    return done(err);
                });
            if(user){
                console.log(user);
                return done(null, user);
            } else {
                return done(null, new Error('no user'));
            }
        })
    );

};
