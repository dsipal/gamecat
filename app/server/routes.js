
var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
const rateLimit = require("express-rate-limit");
const request = require("request-promise");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

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
		if (req.cookies.login == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.validateLoginKey(req.cookies.login, req.ip, function(e, o){
				if (o){
					AM.autoLogin(o.user, o.pass, function(o){
						req.session.user = o;
						res.redirect('/home');
					});
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});

	app.post('/', function(req, res){
		passport.authenticate('local', {
				failureRedirect: '/'   //'/logout?status=login failed'
		}, function(err, user, info){
						if(err){
								res.status(400).send(err);
						}
						if(!user){
								return res.redirect('/');
						}

						else{
								req.session.user = o;
								if (req.body['remember-me'] === 'false'){
									res.redirect('/home');
								}	else{
									AM.generateLoginKey(o.username, req.ip, function(key){
										res.cookie('login', key, { maxAge: 900000 });
										res.redirect('/home');
									});
								}
						}
				}
		);
	});
		// AM.manualLogin(req.body['username'], req.body['password'], function(e, o){
		// 	if (!o){
		// 		res.status(400).send(e);
		// 	}	else{
		// 		console.log(o);
		// 		req.session.user = o;
		// 		if (req.body['remember-me'] === 'false'){
		// 			res.redirect('/home');
		// 		}	else{
		// 			AM.generateLoginKey(o.username, req.ip, function(key){
		// 				res.cookie('login', key, { maxAge: 900000 });
		// 				res.redirect('/home');
		// 			});
		// 		}
		// 	}
		// });


	app.post('/logout', function(req, res){
		res.clearCookie('login');
		req.session.destroy(function(e){ res.status(200).send('ok'); });
	});

/*
	control panel
*/

	app.get('/home', function(req, res) {
		if (req.session.user == null){
			res.redirect('/');
		}else{
			AM.getAccountByID(req.session.user._id).then(function(acc){
				res.render('home', {
					title : 'Control Panel',
					countries : CT,
					udata : acc
				});
			});

		}
	});

	app.post('/home', function(req, res){
		if (req.session.user == null){
			res.redirect('/');
		}	else{
			AM.updateAccount({
				id		: req.session.user._id,
				name	: req.body['name'],
				email	: req.body['email'],
				pass	: req.body['pass'],
				country	: req.body['country']
			}, function(e, o){
				if (e){
					res.status(400).send('error-updating-account');
				}	else{
					req.session.user = o.value;
					res.status(200).send('ok');
				}
			});
		}
	});

/*
	new accounts
*/

	app.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup', countries : CT });
	});

	app.post('/signup', accountCreateLimiter, function(req, res){
		AM.addNewAccount({
			ref_by : req.body['ref_by'],
			name 	: req.body['name'],
			email 	: req.body['email'],
			username 	: req.body['username'],
			password	: req.body['password'],
			country : req.body['country']
		}, function(e){
			if (e){
				res.status(400).send(e);
			}	else{
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
			}	else{
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
			} else{
				req.session.passKey = req.query['key'];
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});

	app.post('/reset-password', function(req, res) {
		let newPass = req.body['pass'];
		let passKey = req.session.passKey;
		// destory the session immediately after retrieving the stored passkey //
		req.session.destroy();
		AM.updatePassword(passKey, newPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
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
		AM.deleteAccount(req.session.user._id, function(e, obj){
			if (!e){
				res.clearCookie('login');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
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
		if (req.session.user == null){
			res.redirect('/');
		}else{
			console.log(req.connection.remoteAddress);

			var body = await request.get('https://cpalead.com/dashboard/reports/campaign_json.php?id=634293&format=json&show=10&subid='+req.session.user._id+'&subid2='+req.sessionID, {json: true});

			res.render('offers', {offers: body.offers});
		}
	});

	app.get('/postback', async function(req, res){
		AM.addPoints(req.query.subid, req.query.payout*10,req.query.subid2);

		res.send(req.query.subid + " was paid " + 10*req.query.payout);
	});


	app.get('/referrals', function(req, res) {
		if (req.session.user == null) {
			res.redirect('/');
		} else {

		}
	});

	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
