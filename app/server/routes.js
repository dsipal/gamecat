//TODO split up routes into separate more managable files/endpoints

var CT = require('./modules/country-list');
var EM = require('./modules/email-dispatcher');
const User = require('./models/User');
const rateLimit = require("express-rate-limit");
const request = require("request-promise");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var qs = require('querystring');

const accountCreateLimiter = rateLimit({
	windowMs: 60*60*1000 * 24, 		//3 Registrations per One Day
	max: 3,
	message:
		"Too many account created on this IP, try again in a day."
});

const genericLimiter = rateLimit({
	windowMs: 	1000, 				//2 Get/Posts per One Second
	max:		2,
	message:
		"Too many refreshes per second, calm down."
});

const passwordResetLimiter = rateLimit({
	windowMs:	60*60*1000,			//2 Pass Resets per One Hour
	max: 2,
	message:
		"Please wait before attempting to reset your password again."
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
			//TODO *removed call to AM for autoLogin and validateLoginKey*
			User.validateLoginKey(req.cookies.login, req.ip, function(e, o){
				if (o){
					User.autoLogin(o.user, o.pass, function(o){
						res.redirect('/home');
					});
				} else {

					res.render('login');
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
				//TODO *removed call to AM- moved function to User.js *
				User.generateLoginKey(req.user.username, req.ip, function(key){
					res.cookie('login', key, { maxAge: 900000 });
					res.redirect('/home');
				});
			}
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

	app.post('/signup', function(req, res){
		User.validateNewAccount({
			username:   req.body['username'],
			password:   req.body['password'],
			passwordV: req.body['password_verify'],
			name:       req.body['name'],
			email:      req.body['email'],
			country:    req.body['country'],
			ref_by:     req.body['ref_by'],
			email_optin: req.body['email_optin'] !== null,
			terms_conditions: req.body['terms_conditions'] !== null

		}, function(e, o) {
			console.log(e, o);
			if(e){
				res.status(400).send(e);
			} else {
                //res.redirect('/home');
				o.percolateReferrals();
				res.status(200).send('ok');
			}
		});

	});

	/*
        password reset
    */

	//TODO ensure password reset works, add rate limit, remove AM call
	app.post('/lost-password', function(req, res){

		let resetEmail = req.body['email'];
		User.findOne({email:resetEmail}, function(e, o) {
			if(e) {
				console.log('Problem With Reset' + req.query.name + '   ' + req.query.id);
			} else if(!o){
				res.status(400).send('Reset email not sent, invalid email');
			} else{
				EM.dispatchPasswordReset(resetEmail, o.updateToken(), o.username, function(err){
					if(!err){
						res.redirect('/');
					} else {
						res.redirect('/');
						res.status(400).send('Error in dispatching email');
						console.log(err);
					}
				});

				// o.resetPassword(req.query.id, function(success){
				// 	if(success){
				// 		res.redirect('/');
				// 	} else {
				// 		res.redirect('/signup');
				// 	}
				// });
			}
		});


		// req.user.generatePasswordKey(email, req.ip, function(e, account){
		// 	if (e){
		// 		res.status(400).send(e);
		// 	} else {
		// 		EM.dispatchPasswordReset(account, function(e, m){
		// 			// TODO this callback takes a moment to return, add a loader to give user feedback //
		// 			if (!e){
		// 				res.status(200).send('ok');
		// 			}	else{
		// 				for (k in e) console.log('ERROR : ', k, e[k]);
		// 				res.status(400).send('unable to dispatch password reset');
		// 			}
		// 		});
		// 	}
		// });

	});

	app.get('/reset', function(req, res) {
		console.log('Reset attempt by: ' + req.query.name + ' TOKEN: ' + req.query.id);
		User.findOne({username:req.query.name}, function(e, o){
			if(e || !o){
				res.redirect('/');
			} else{
				if(o.token === req.query.id){
					console.log('Valid Token');
					req.session.token = o.token;
					res.render('reset', { title : 'Reset Password' });
				} else{
					res.status(400).send('Invalid Reset Token');
				}
			}
		});

	});

	app.post('/reset', function(req, res) {
		let newPass = req.body['pass'];
		let newToken = req.session.token;
		req.session.destroy();
		User.findOne({token:newToken}, function(e, o){
			if(o){
				o.resetPassword(newPass, newToken,function(success){
					if(success){
						console.log('Password Reset Complete for: ' + o.username);
						res.redirect('/');
					} else{
						console.log('Password Reset Failed');
					}
				});
			} else{
				console.log('Password Reset User Not Found');
			}
		});
	});

	// app.get('/reset-password', function(req, res) {
	// 	req.user.validatePasswordKey(req.query['key'], req.ip, function(e, o){
	// 		if (e || o == null){
	// 			res.redirect('/');
	// 		} else {
	// 			req.session.passKey = req.query['key'];
	// 			res.render('reset', { title : 'Reset Password' });
	// 		}
	// 	})
	// });
	//
	// app.post('/reset-password', function(req, res) {
	// 	// TODO work password reset in with mailgun, remove account manager
	// 	let newPass = req.body['pass'];
	// 	let passKey = req.session.passKey;
	// 	// destroy the session immediately after retrieving the stored passkey //
	// 	req.session.destroy();
	// 	req.user.updatePassword(passKey, newPass, function(e, o){
	// 		if (o){
	// 			res.status(200).send('ok');
	// 		} else {
	// 			res.status(400).send('unable to update password');
	// 		}
	// 	})
	// });

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
		//TODO *added ip restrictions to postback*, ensure that it works correctly with Adscend

		User.getByID().addPoints(req.query.payout*10);

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
	//TODO add check to see if user has verified email && add correct error response
	return function(req, res, next){
		if(!req.isAuthenticated || !req.isAuthenticated()){
			res.status(401).send('not-authenticated');
		} else if(req.user.rank === 'new'){
			res.status(401).send('not-verified');
		} else {
			next();
		}
	}
}
