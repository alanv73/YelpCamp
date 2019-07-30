require('dotenv').config();

const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	LocalStrategy = require('passport-local'),
	methodOverride = require('method-override'),
	Campground = require('./models/campground'),
	Comment = require('./models/comment'),
	User = require('./models/user'),
	flash = require('connect-flash'),
	seedDB = require('./seeds.js');

// requiring ROUTES
const commentRoutes = require('./routes/comments'),
	campgroundRoutes = require('./routes/campgrounds'),
	indexRoutes = require('./routes/index');

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.Promise = Promise;

// mongoose.connect('mongodb://localhost/yelp_camp_v12');
// mongoose.connect(
// 	'mongodb+srv://alanv73:mongodbn3sov@cluster0-qtqk3.mongodb.net/yelp_camp_v12?retryWrites=true&w=majority'
// );
mongoose.connect(process.env.DATABASEURL);

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(flash());
app.locals.moment = require('moment');

// seed the database
// seedDB();

// PASSPORT config
app.use(
	require('express-session')({
		secret            : 'buoyant credible actor',
		resave            : false,
		saveUninitialized : false
	})
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');
	next();
});

/********* ROUTES **********/
// requiring route files from express router
app.use('/', indexRoutes);
app.use('/campgrounds/:id/comments', commentRoutes);
app.use('/campgrounds', campgroundRoutes);

/**************************************
 * Listen for connections on port 3000
 **************************************/

app.listen(process.env.PORT || 3000, () => {
	console.log('YelpCamp listening on port 3000...');
});
