var express = require("express");
var router  = express.Router();
var Shop = require("../models/shops");
var middleware = require("../middleware");

//INDEX - show all shops
router.get("/", function(req, res){
    // Get all shops from DB
    Shop.find({}, function(err, allShops){
       if(err){
           console.log(err);
       } else {
          res.render("shops/index",{shops:allShops});
       }
    });
});

//CREATE - add new shop to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to shops array
    var name = req.body.name;
    var image = req.body.image;
	var contact = req.body.contact;
    var address = req.body.address;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
    var newShop = {
		name: name, 
		image: image, 
		contact: contact,
		address: address,
		author: author
	};
    // Create a new shop and save to DB
    Shop.create(newShop, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to shops page
            res.redirect("/shops");
        }
    });
});

//NEW - show form to create new shop
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("shops/new"); 
});

// SHOW - shows more info about one shop
router.get("/:id", function(req, res){
    //find the shop with provided ID
    Shop.findById(req.params.id).populate("comments").exec(function(err, foundShop){
        if(err){
            console.log(err);
        } else {
            //render show template with that shop
            res.render("shops/show", {shop: foundShop});
        }
    });
});

// EDIT - Shop
router.get("/:id/edit", middleware.checkShopOwnership, function(req, res){
	Shop.findById(req.params.id, function(err, foundShop){
		res.render("shops/edit", {shop: foundShop});	
	});
});

// UPDATE - Shop
router.put("/:id", middleware.checkShopOwnership, function(req, res){
	// find & update the correct shop
	Shop.findByIdAndUpdate(req.params.id, req.body.shop, function(err, updatedShop){
		if(err){
			res.redirect("/shops");
		}
		else{
			// redirect to the show page
			res.redirect("/shops/" + req.params.id);
		}
	});
});

// DESTROY - Shop
router.delete("/:id", middleware.checkShopOwnership, function(req, res){
	Shop.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/shops");
		}
		else{
			res.redirect("/shops");
		}
	});
});

module.exports = router;