var Shops = require("../models/shops");
var Comment = require("../models/comment");

// all the middlewares go here

var middlewareObj = {};

middlewareObj.checkShopOwnership = function(req, res, next) {
	if(req.isAuthenticated()){
		Shops.findById(req.params.id, function(err, foundShop){
			if(err){
				req.flash("error", "Campground not found");
				res.redirect("back");
			}
			else{
				// does user own the campground
				if(foundShop.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				}
				else{
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	}
	else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err){
				res.redirect("back");
			}
			else{
				// does user own the comment
				if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				}
				else{
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	}
	else{
		req.flash("error", "You need to login to do that");
		res.redirect("back");
	}
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
	req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}

module.exports = middlewareObj