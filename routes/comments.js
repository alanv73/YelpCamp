const express = require('express');
const router = express.Router({ mergeParams: true });
const Campground = require('../models/campground');
const Comment = require('../models/comment');
const middleware = require('../middleware'); // automatically looks for index.js

/********************
 * COMMENTS routes
 * ================
 * NEW COMMENTS route
 ********************/

router.get('/new', middleware.isLoggedIn, (req, res) => {
	Campground.findById(req.params.id)
		.then((campground) => {
			res.render('comments/new', {
				campground : campground
			});
		})
		.catch((err) => {
			console.log('Error: ', err);
			res.redirect('/campgrounds');
		});
});

//CREATE COMMENTS route
router.post('/', middleware.isLoggedIn, (req, res) => {
	Campground.findById(req.params.id)
		.then((campground) => {
			Comment.create(req.body.comment)
				.then((comment) => {
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					comment.save();
					campground.comments.push(comment);
					campground.save();
					req.flash(
						'success',
						'Comment successfully added'
					);
					res.redirect(`/campgrounds/${campground._id}`);
				})
				.catch((err) => {
					req.flash('error', 'An error occurred');
					console.log('Error: ', err);
				});
		})
		.catch((err) => {
			req.flash('error', 'Task failed successfully');
			console.log('Error: ', err);
			res.redirect('/campgrounds');
		});
});

// EDIT COMMENT route
router.get(
	'/:comment_id/edit',
	middleware.checkCommentOwnership,
	(req, res) => {
		Comment.findById(req.params.comment_id)
			.then((comment) => {
				res.render('comments/edit', {
					comment       : comment,
					campground_id : req.params.id
				});
			})
			.catch((err) => {
				res.redirect('back');
			});
	}
);

// UPDATE COMMENT route
router.put(
	'/:comment_id',
	middleware.checkCommentOwnership,
	(req, res) => {
		Comment.findByIdAndUpdate(
			req.params.comment_id,
			req.body.comment
		)
			.then(() => {
				console.log(
					`comment updated on campground '${req.params.id}'`
				);
				res.redirect(`/campgrounds/${req.params.id}`);
			})
			.catch((err) => {
				res.redirect('back');
			});
	}
);

// DESTROY COMMENT route
router.delete(
	'/:comment_id',
	middleware.checkCommentOwnership,
	(req, res) => {
		Comment.findByIdAndRemove(req.params.comment_id)
			.then(() => {
				req.flash('success', 'Comment successfully deleted');
				res.redirect(`/campgrounds/${req.params.id}`);
			})
			.catch((err) => {
				res.redirect('back');
			});
	}
);

module.exports = router;
