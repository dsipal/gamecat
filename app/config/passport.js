var LocalStrategy = require('passport-local').Strategy;
var AM = require('../server/modules/account-manager');
var mongoose = require('mongoose');
var User = require('../server/models/User');

module.exports = function(passport) {

  passport.serializeUser(function(user, done) {
      done(null, user.id);
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

          if(user.activated === false){
              console.log('can not use new user');
              return done('user not activated yet, please use your activation email', false);
          }

          AM.validatePassword(password, user.password, function(err, match){
              if(err){
                  return done(err);
              }
              if(match){
                  return done(null, user);
              }
          });
        });
    }));


}
