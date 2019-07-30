const express = require('express');
const router = express.Router();
const Campground = require('../models/campground');
const middleware = require('../middleware'); // automatically looks for index.js
var NodeGeocoder = require('node-geocoder');

var options = {
	provider    : 'google',
	httpAdapter : 'https',
	apiKey      : process.env.GEOCODER_API_KEY,
	formatter   : null
};

var geocoder = NodeGeocoder(options);

// INDEX Route - show all campgrounds
router.get('/', (req, res) => {
	// get all campgrounds from db
	Campground.find()
		.then((allCampgrounds) => {
			res.render('campgrounds/index', {
				campgrounds : allCampgrounds,
				page        : 'campgrounds'
			});
		})
		.catch((err) => {
			console.log('error: ', err);
		});
});

// CREATE CAMPGROUND route - add new campground to db
router.post('/', middleware.isLoggedIn, (req, res) => {
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var desc = req.body.description;
	var author = {
		id       : req.user._id,
		username : req.user.username
	};
	geocoder.geocode(req.body.location, function(err, data) {
		if (err || !data.length) {
			req.flash('error', 'Invalid address');
			return res.redirect('back');
		}
		var lat = data[0].latitude;
		var lng = data[0].longitude;
		var location = data[0].formattedAddress;

		var newCampground = {
			name        : name,
			price       : price,
			image       : image,
			description : desc,
			author      : author,
			location    : location,
			lat         : lat,
			lng         : lng
		};

		// save new campground to db
		Campground.create(newCampground)
			.then((campground) => {
				console.log(
					`campground '${campground.name}' successfully created`
				);
			})
			.catch((err) => {
				console.log('Error :', err);
			});

		res.redirect('/campgrounds');
	});
});

//NEW CAMPGROUND route - show form to create new campground
router.get('/new', middleware.isLoggedIn, (req, res) => {
	res.render('campgrounds/new');
});

/***************************************************
 * SHOW CAMPGROUND route - show info about one campground
 * be careful of the order in the code, we dont want 
 * /campground/new to be mistaken for /campground/id
 ***************************************************/
router.get('/:id', (req, res) => {
	Campground.findById(req.params.id)
		.populate('comments')
		.exec((err, foundCampground) => {
			if (err) {
				console.log('Error: ', err);
			} else {
				res.render('campgrounds/show', {
					campground : foundCampground
				});
			}
		});
});

// EDIT CAMPGROUND route
router.get(
	'/:id/edit',
	middleware.checkCampgroundOwnership,
	(req, res) => {
		Campground.findById(req.params.id)
			.then((foundCampground) => {
				res.render('campgrounds/edit', {
					campground : foundCampground
				});
			})
			.catch((err) => {
				req.flash('error', 'Campground not found');
			});
	}
);

// UPDATE CAMPGROUND route
router.put(
	'/:id',
	middleware.checkCampgroundOwnership,
	(req, res) => {
		geocoder.geocode(req.body.location, function(err, data) {
			if (err || !data.length) {
				req.flash('error', 'Invalid Address');
				return res.redirect('back');
			}
			req.body.campground.lat = data[0].latitude;
			req.body.campground.lng = data[0].longitude;
			req.body.campground.location = data[0].formattedAddress;

			Campground.findByIdAndUpdate(
				req.params.id,
				req.body.campground
			)
				.then((updatedCampground) => {
					console.log(
						`campground '${updatedCampground.name}' updated`
					);
					res.redirect(`/campgrounds/${req.params.id}`);
				})
				.catch((err) => {
					console.log('Error: ', err);
					res.redirect(`/campgrounds`);
				});
		});
	}
);

//DESTROY CAMPGROUND route
router.delete(
	'/:id',
	middleware.checkCampgroundOwnership,
	(req, res) => {
		Campground.findById(req.params.id)
			.then((campground) => {
				campground.remove();
				console.log(
					`campground '${campground.name}' deleted`
				);
				req.flash(
					'success',
					'Campground successfully deleted'
				);
				res.redirect('/campgrounds');
			})
			.catch((err) => {
				console.log('Error: ', err);
				res.redirect('/campgrounds');
			});
	}
);

module.exports = router;
