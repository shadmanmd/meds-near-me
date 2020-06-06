var mongoose 				= require("mongoose"),
	passportLocalMongoose 	= require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	email: {type: String, unique: true},
	username: String,
	password: String,
	isAdmin: {type: Boolean, default: false},
	resetPasswordToken: String,
	resetPasswordExpires: Date
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);