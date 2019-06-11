
var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
const User = require('./models/User');
const request = require("request-promise");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var qs = require('querystring');

module.exports = function(app) {

	/*
        login & logout
    */
	app.get('/', function(req, res){
		// check if the user has an auto login key saved in a cookie //
		if (req.cookies.login === undefined || !req.isAuthenticated()){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		} else {
			// attempt automatic login //
			AM.validateLoginKey(req.cookies.login, req.ip, function(e, o){
				if (o){
					AM.autoLogin(o.user, o.pass, function(o){
						req.session.user = o;
						res.redirect('/home');
					});
				} else {
					res.render('login', { title: 'Hello - Please Login To Your Account' });
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
				AM.generateLoginKey(req.user.username, req.ip, function(key){
					res.cookie('login', key, { maxAge: 900000 });
					res.redirect('/home');
				});
			}
		console.log(req.user);
	});

	app.post('/logout', function(req, res){
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

	app.get('/home', function(req, res) {
		if (!req.isAuthenticated()){
			res.redirect('/');
		} else {
			AM.getAccountByID(req.user._id).then(function(acc){
				res.render('home', {
					title: 'Control Panel',
					countries: CT,
					udata: acc
				});
			});

		}
	});

	app.post('/home', function(req, res){
		if (!req.isAuthenticated()){
			res.redirect('/');
		} else {
			// AM.updateAccount({
			// 	id: req._passport.instance._userProperty,
			// 	name: req.body['name'],
			// 	email: req.body['email'],
			// 	pass: req.body['pass'],
			// 	country: req.body['country']
			// }, function(e, o){
			// 	if (e){
			// 		res.status(400).send('error-updating-account');
			// 	}	else{
			// 		res.status(200).send('ok');
			// 	}
			// });

			console.log('pass in form ' + req.body['pass']);
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
		}
	});

	/*
        new accounts
    */

	app.get('/signup', function(req, res) {
		var ref_by = req.query.ref_by;
		res.render('signup', {  title: 'Signup', countries : CT, ref_by: ref_by });
	});

	app.post('/signup', function(req, res){
		// AM.addNewAccount({
		// 	ref_by: req.body['ref_by'],
		// 	name: req.body['name'],
		// 	email: req.body['email'],
		// 	username: req.body['username'],
		// 	password: req.body['password'],
		// 	country: req.body['country']
		// }, function(e){
		// 	if (e){
		// 		res.status(400).send(e);
		// 	} else {
		// 		res.status(200).send('ok');
		// 	}
		// });

		User.addNewAccount({
				ref_by: req.body['ref_by'],
				name: req.body['name'],
				email: req.body['email'],
				username: req.body['username'],
				password: req.body['password'],
				country: req.body['country']
		}, function(e, o) {
			if(e){
				res.status(400).send(e);
			} else {
				o.percolateReferrals();
				res.status(200).send('ok');
			}
		});

	});

	/*
        password reset
    */

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

	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});

	app.post('/delete', function(req, res){
		AM.deleteAccount(req._passport.instance._userProperty, function(e, obj){
			if (!e){
				res.clearCookie('login');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			} else {
				res.status(400).send('record not found');
			}
		});
	});

	app.get('/reset', function(req, res) {
		AM.deleteAllAccounts(function(){
			res.redirect('/print');
		});
	});

	app.get('/offers', async function(req, res){
		if (!req.isAuthenticated()){
			res.redirect('/');
		} else {
			var api_key = 'JlD8HGBVzQ7cBWpTEwwcd0zDgmLe9YecLPdf33vWviFLAQKsvTLj4aielhxT';
			var pub_id = '9359';
			var ad_wall_id = '16028';

			var limit = 10;
			var offset = req.query.page * limit || 0;

			var query_strings = {
				subid1: req.user._id.toString(),
				limit: limit,
				offset: offset,
				sort_by: 'popularity',
				ip: req.ip
			};

			request({
				url: 'http://adscendmedia.com/adwall/api/publisher/9359/profile/16028/offers.json',
				qs: query_strings,
				auth: {
					'user': pub_id,
					'pass': api_key
				}
			}, function(e, response, body){
				if(e){
					console.log(e);
				} else {
					var json = JSON.parse(body);
					res.render('offers', {offers: json.offers});
				}
			});
		}
	});

	app.get('/postback', async function(req, res){
		AM.addPoints(req.query.subid1, req.query.payout*10);

		res.send(req.query.subid1 + " was paid " + 10 * req.query.payout);
	});

	app.get('/referrals', function(req, res) {
		if (!req.isAuthenticated()) {
			res.redirect('/');
		} else {
			var ref_link = req.protocol + '://' + req.headers.host + '/signup?ref_by=' + req.user.username;
			res.render('referrals', {ref_link: ref_link, referrals: req.user.referrals});
		}
	});

	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });
};
