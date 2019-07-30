const mongoose = require('mongoose'),
	passportlocalMongoose = require('passport-local-mongoose');

var UserSchema = new mongoose.Schema({
	username             : String,
	password             : String,
	avatar               : String,
	firstName            : String,
	lastName             : String,
	email                : {
		type: String,
		unique: true,
		required: true
	},
	resetPasswordToken   : String,
	resetPasswordExpires : Date,
	isAdmin              : { type: Boolean, default: false }
});

UserSchema.plugin(passportlocalMongoose);

module.exports = mongoose.model('User', UserSchema);
