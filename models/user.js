var mongoose 				= require("mongoose"),
	passportLocalMongoose 	= require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	email: {type: String, unique: true},
	username: String,
	password: String,
	dp: {type: String, default:"https://octodex.github.com/images/yaktocat.png"},
	isAdmin: {type: Boolean, default: false},
	resetPasswordToken: String,
	resetPasswordExpires: Date
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);