var express = require("express");
var router  = express.Router();
var Shop = require("../models/shops");
var middleware = require("../middleware");

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'shadmanmd', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//INDEX - show all shops
router.get("/", function(req, res){
	if(req.query.search) {
		Shop.find().where('city').equals(req.query.search).exec(function(err, foundShops){
			if(err){
				req.flash('error', err.message);
			} else {
				res.render("shops/index", {shops:foundShops});	
			}
		});
	} else {
		Shop.find({}, function(err, allShops){
		   if(err){
			   console.log(err);
		   } else {
			  res.render("shops/index",{shops:allShops});
		   }
		});
	}
});

//CREATE - add new shop to DB
router.post("/", middleware.isLoggedIn, upload.single('shop[image]'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the shop object under image property
      req.body.shop.image = result.secure_url;
      // add image's public_id to shop object
      req.body.shop.imageId = result.public_id;
      // add author to shop
      req.body.shop.author = {
        id: req.user._id,
        username: req.user.username
      }
	  Shop.create(req.body.shop, function(err, shop) {
		if (err) {
		  req.flash('error', err.message);
		  return res.redirect('back');
		}
		res.redirect('/shops/' + shop.id);
	  });
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
router.put("/:id", upload.single('shop[image]'), function(req, res){
    Shop.findById(req.params.id, async function(err, shop){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(shop.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  shop.imageId = result.public_id;
                  shop.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            shop.name = req.body.shop.name;
            shop.address = req.body.shop.address;
			shop.contact = req.body.shop.contact;
			shop.city = req.body.shop.city;
			shop.opensAt = req.body.shop.opensAt;
			shop.closesAt = req.body.shop.closesAt;
			if(req.body.shop.days)
				shop.days = req.body.shop.days;
            shop.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/shops/" + shop._id);
        }
    });
});

// DESTROY - Shop
router.delete('/:id', function(req, res) {
  Shop.findById(req.params.id, async function(err, shop) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
        await cloudinary.v2.uploader.destroy(shop.imageId);
        shop.remove();
        req.flash('success', 'Shop deleted successfully!');
        res.redirect('/shops');
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
});

module.exports = router;