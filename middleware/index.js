const Campground = require('../models/campground');
const Comment = require('../models/comment');

// all middleware
const middlewareObj = {};

middlewareObj.checkCampgroundOwnership = (req, res, next) => {
	if (req.isAuthenticated()) {
		Campground.findById(req.params.id)
			.then((foundCampground) => {
				// if user owns campground
				if (
					foundCampground.author.id.equals(req.user._id) ||
					req.user.isAdmin
				) {
					next();
				} else {
					// if user doesn't own campground
					req.flash('error', 'Permission required');
					res.redirect('back');
				}
			})
			.catch((err) => {
				req.flash('error', 'Campground not found');
				res.redirect('back');
			});
	} else {
		// if user not logged in
		req.flash('error', 'Sign-In required');
		res.redirect('back');
	}
};

middlewareObj.checkCommentOwnership = (req, res, next) => {
	if (req.isAuthenticated()) {
		Comment.findById(req.params.comment_id)
			.then((foundComment) => {
				// if user owns comment
				if (
					foundComment.author.id.equals(req.user._id) ||
					req.user.isAdmin
				) {
					next();
				} else {
					// if user doesn't own comment
					req.flash('error', 'Permission required');
					res.redirect('back');
				}
			})
			.catch((err) => {
				req.flash('error', 'Comment not found');
				res.redirect('back');
			});
	} else {
		// if user not logged in
		req.flash('error', 'Sign-In required');
		res.redirect('back');
	}
};

middlewareObj.isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	req.flash('error', 'Sign-In required');
	res.redirect('/login');
};

module.exports = middlewareObj;
