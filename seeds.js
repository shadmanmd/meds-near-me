var mongoose = require("mongoose");
var Shop = require("./models/shops");
var Comment = require("./models/comment");
var User = require("./models/user");

function seedDB() {
	//Remove all shops
	Shop.remove({}, function(err){
		if(err){
			console.log(err);
		}
		console.log("Removed shops!");
		//Remove all comments
		Comment.remove({}, function(err){
			if(err){
				console.log(err);
			}
			console.log("Removed comments!");
		});
	});
	//Remove all users
	User.remove({}, function(err){
		if(err){
			console.log(err);
		}
		console.log("Removed Users!");
	})
}

module.exports = seedDB;