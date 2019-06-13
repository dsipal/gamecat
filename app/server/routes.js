//TODO split up routes into separate more managable files/endpoints

var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
const User = require('./models/User');
const rateLimit = require("express-rate-limit");
const request = require("request-promise");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var qs = require('querystring');

const accountCreateLimiter = rateLimit({
	windowMs: 60*60*1000 * 24,
	max: 3,
	message:
		"Too many account created on this IP, try again in a day."
});

module.exports = function(app) {

	/*
        login & logout
    */
	app.get('/', function(req, res){
		// check if the user has an auto login key saved in a cookie //
		if (req.cookies.login === undefined || !req.isAuthenticated()){
			res.render('login', {
			    title: 'Hello - Please Login To Your Account'
			});
		} else {
			// attempt automatic login //
			//TODO remove call to AM
			AM.validateLoginKey(req.cookies.login, req.ip, function(e, o){
				if (o){
					AM.autoLogin(o.user, o.pass, function(o){
						req.session.user = o;
						res.redirect('/home');
					});
				} else {

					res.render('login', {
					    title: 'Hello - Please Login To Your Account',
					});
				}
			});
		}
	});

	app.post('/',
		passport.authenticate('local', {
			session: true,
			failureRedirect: '/'   //'/logout?status=login failed'
		}), function(req, res){
			if (req.body['remember-me'] === 'false'){
				res.redirect('/home');
			} else {
				//TODO remove call to AM- move function to User.js
				AM.generateLoginKey(req.user.username, req.ip, function(key){
					res.cookie('login', key, { maxAge: 900000 });
					res.redirect('/home');
				});
			}
			console.log(req.user);
		});

	app.post('/logout', ensureAuthenticated(), function(req, res){
		res.clearCookie('login');
		req.session.destroy(function(e){
			if(e) {
				console.log(e);
			} else {
				res.status(200).send('ok');
			}
		});
	});

	/*
        control panel
    */
	//TODO move updating account to different page, add balance, other details
	app.get('/home', ensureAuthenticated(), function(req, res) {
		res.render('home', {
			title: 'Control Panel',
			countries: CT,
			udata: req.user
		});

	});

	app.post('/home', ensureAuthenticated(), function(req, res){
		req.user.updateAccount({
			id: req._passport.instance._userProperty,
			name: req.body['name'],
			email: req.body['email'],
			country: req.body['country'],
			password: req.body['password'],
		}, function(e, o){
			if(e){
				res.status(400).send('error-updating-account');
			} else {
				res.status(200).send('ok');
			}
		})
	});

	/*
        new accounts
    */
	app.get('/signup', function(req, res) {
		var ref_by = req.query.ref_by;
		res.render('signup', {
		    title: 'Signup',
            countries : CT,
            ref_by: ref_by
		});
	});

	app.post('/signup', accountCreateLimiter, function(req, res){
		console.log(req.body);

		User.addNewAccount({
			username:   req.body['username'],
			password:   req.body['password'],
			name:       req.body['name'],
			email:      req.body['email'],
			country:    req.body['country'],
			ref_by:     req.body['ref_by'],
			email_optin: req.body['email-optin'] === "optin-true"

		}, function(e, o) {
			if(e){
				res.status(400).send(e);
			} else {
				o.percolateReferrals();
                //res.redirect('/home');
				res.status(200).send('ok');
			}
		});

	});

	/*
        password reset
    */

	//TODO ensure password reset works, add rate limit, remove AM call
	app.post('/lost-password', function(req, res){
		let email = req.body['email'];
		AM.generatePasswordKey(email, req.ip, function(e, account){
			if (e){
				res.status(400).send(e);
			} else {
				EM.dispatchResetPasswordLink(account, function(e, m){
					// TODO this callback takes a moment to return, add a loader to give user feedback //
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		AM.validatePasswordKey(req.query['key'], req.ip, function(e, o){
			if (e || o == null){
				res.redirect('/');
			} else {
				req.session.passKey = req.query['key'];
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});

	app.post('/reset-password', function(req, res) {
		// TODO work password reset in with mailgun, remove account manager
		let newPass = req.body['pass'];
		let passKey = req.session.passKey;
		// destroy the session immediately after retrieving the stored passkey //
		req.session.destroy();
		AM.updatePassword(passKey, newPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			} else {
				res.status(400).send('unable to update password');
			}
		})
	});

	/*
        view, delete & reset accounts
    */

	app.post('/delete', function(req, res){
		//TODO ensure that deleting a user works correctly
		req.user.deleteAccount();
		res.clearCookie('login');
	});

	app.get('/offers', ensureAuthenticated(), async function(req, res){
		//TODO get offer page working on single page, add different tabs for different types of offers
		res.render('offers', {
			subid1: req.user._id
		})
	});

	app.get('/postback', async function(req, res){
		//TODO add ip restrictions to postback, ensure that it works correctly with Adscend
		AM.addPoints(req.query.subid1, req.query.payout*10);

		res.send(req.query.subid1 + " was paid " + 10 * req.query.payout);
	});

	app.get('/referrals', ensureAuthenticated(), function(req, res) {
		//TODO possibly add multi-tiered referrals
		var ref_link = req.protocol + '://' + req.headers.host + '/signup?ref_by=' + req.user.username;
		res.render('referrals', {ref_link: ref_link, referrals: req.user.referrals});

	});

	app.get('/verify', function(req, res){
		//TODO ensure that verification through email works, limit pages that user can access without verification
		User.findOne({username:req.query.name}, function(e, o) {
			if(e) {
				console.log('Problem With Verification' + req.query.name + '   ' + req.query.id);
			} else{
				o.confirmAccount(req.query.id, function(success){
					if(success){
						res.redirect('/');
					} else {
						res.redirect('/signup');
					}
				});
			}
		})
	});

	//TODO design custom 404 page
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });


};

function ensureAuthenticated(){
	//TODO add check to see if user has verified email
	return function(req, res, next){
		if(!req.isAuthenticated || !req.isAuthenticated()){
			res.status(401).send('not-authenticated')
		} else {
			next()
		}
	}
}
