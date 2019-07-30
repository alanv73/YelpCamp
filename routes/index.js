const express = require('express'),
	router = express.Router(),
	passport = require('passport'),
	User = require('../models/user'),
	Campground = require('../models/campground'),
	async = require('async'),
	nodemailer = require('nodemailer'),
	crypto = require('crypto');

// ROOT route
router.get('/', (req, res) => {
	res.render('landing');
});

/************************
 * AUTH routes
 ************************/
// REGISTER GET route - show register form
router.get('/register', (req, res) => {
	res.render('register', { page: 'register' });
});

// REGISTER POST route - signup logic
router.post('/register', (req, res) => {
	var newUser = new User({
		username  : req.body.username,
		firstName : req.body.firstName,
		lastName  : req.body.lastName,
		email     : req.body.email,
		avatar    : req.body.avatar
	});
	User.register(newUser, req.body.password)
		.then((user) => {
			passport.authenticate('local')(req, res, function() {
				req.flash('success', `Welcome, ${user.username}`);
				res.redirect('/campgrounds');
			});
		})
		.catch((err) => {
			req.flash('error', err.message);
			return res.redirect('register');
		});
});

// LOGIN GET route - show login form
router.get('/login', (req, res) => {
	res.render('login', { page: 'login' });
});

// LOGIN POST route - login logic
router.post(
	'/login',
	passport.authenticate('local', {
		successRedirect : '/campgrounds',
		failureRedirect : '/login'
	}),
	(req, res) => {
		/* unnecessary callback*/
	}
);

// LOGOUT route
router.get('/logout', (req, res) => {
	req.logout();
	req.flash('success', 'Logged Out');
	res.redirect('/campgrounds');
});

//FORGOT PASSWORD get route
router.get('/forgot', (req, res) => {
	res.render('forgot');
});

// FORGOT PASSWORD post route
router.post('/forgot', (req, res) => {
	async.waterfall(
		[
			function(done) {
				crypto.randomBytes(20, function(err, buf) {
					var token = buf.toString('hex');
					done(err, token);
				});
			},
			function(token, done) {
				User.findOne({
					email : req.body.email
				}).then((user) => {
					if (!user) {
						req.flash(
							'error',
							'No account with that email address exists'
						);
						return res.redirect('/forgot');
					}

					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

					user.save((err) => {
						done(err, token, user);
					});
				});
			},
			function(token, user, done) {
				var smtpTransport = nodemailer.createTransport({
					service : 'Gmail',
					auth    : {
						user : 'alanv73@gmail.com',
						pass : process.env.GMAILPW
					}
				});
				var mailOptions = {
					to      : user.email,
					from    : 'alanv73@gmail.com',
					subject : 'YelpCamp Password Reset',
					text    :
						'You are recieving this because you (or someone else) have requested a reset of the password to your YelpCamp account.' +
						'Please click the following link or paste it into your browser to complete the reset process:' +
						'http://' +
						req.headers.host +
						'/reset/' +
						token +
						'\n\n' +
						'If you did not request this, please ignore this email and your password will remain unchanged.'
				};
				smtpTransport.sendMail(mailOptions, function(err) {
					console.log('mail sent');
					req.flash(
						'success',
						`An email has been sent to ${user.email} with further instructions.`
					);
					done(err, 'done');
				});
			}
		],
		function(err) {
			if (err) return next(err);
			res.redirect('/forgot');
		}
	);
});

// PASSWORD RESET get route
router.get('/reset/:token', (req, res) => {
	User.findOne(
		{
			resetPasswordToken   : req.params.token,
			resetPasswordExpires : { $gt: Date.now() }
		},
		function(err, user) {
			if (!user) {
				req.flash(
					'error',
					'Password reset token is invalid or has expired.'
				);
				return res.redirect('/forgot');
			}
			res.render('reset', { token: req.params.token });
		}
	);
});

// PASSWORD RESET post route
router.post('/reset/:token', (req, res) => {
	async.waterfall(
		[
			function(done) {
				User.findOne(
					{
						resetPasswordToken   : req.params.token,
						resetPasswordExpires : { $gt: Date.now() }
					},
					function(err, user) {
						if (!user) {
							req.flash(
								'error',
								'Password reset token is invalid or has expired.'
							);
							return res.redirect('back');
						}
						if (req.body.password === req.body.confirm) {
							user.setPassword(
								req.body.password,
								function(err) {
									user.resetPasswordToken = undefined;
									user.resetPasswordExpires = undefined;

									user.save(function(err) {
										req.logIn(user, function(
											err
										) {
											done(err, user);
										});
									});
								}
							);
						} else {
							req.flash(
								'error',
								'Passwords do not match.'
							);
							return res.redirect('back');
						}
					}
				);
			},
			function(user, done) {
				var smtpTransport = nodemailer.createTransport({
					service : 'Gmail',
					auth    : {
						user : 'learntocodeinfo@gmail.com',
						pass : process.env.GMAILPW
					}
				});
				var mailOptions = {
					to      : user.email,
					from    : 'learntocodeinfo@mail.com',
					subject : 'Your password has been changed',
					text    :
						'Hello,\n\n' +
						'This is a confirmation that the password for your account ' +
						user.email +
						' has just been changed.\n'
				};
				smtpTransport.sendMail(mailOptions, function(err) {
					req.flash(
						'success',
						'Success! Your password has been changed.'
					);
					done(err);
				});
			}
		],
		function(err) {
			res.redirect('/campgrounds');
		}
	);
});

// USER PROFILE
router.get('/users/:id', (req, res) => {
	User.findById(req.params.id, function(err, foundUser) {
		if (err) {
			req.flash('error', 'Something went wrong.');
			res.redirect('/');
		}
		Campground.find()
			.where('author.id')
			.equals(foundUser._id)
			.exec(function(err, campgrounds) {
				if (err) {
					req.flash('error', 'Something went wrong.');
					res.redirect('/');
				}
				res.render('users/show', {
					user        : foundUser,
					campgrounds : campgrounds
				});
			});
	});
});

module.exports = router;
