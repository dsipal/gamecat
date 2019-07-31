//TODO clean up code in passport.js, capitalization and wording of text shown to user.
const LocalStrategy = require('passport-local').Strategy;
const GoogleOAuth = require('passport-google-oauth').OAuth2Strategy;
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
        callbackURL: process.env.GOAUTH_REDIR,
    },
        function(accessToken, refreshToken, profile, done) {
            console.log(profile);
            User.findOne({ email: profile.email }, function(err, user){
                if(err) return done(err, false);


            })
        }))
};
