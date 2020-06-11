var express 	= require("express"),
	router  	= express.Router(),
	passport 	= require("passport"),
	nodemailer	= require("nodemailer"),
	crypto		= require("crypto"),
	async		= require("async"),
	User 		= require("../models/user"),
	Shops		= require("../models/shops");

// Multer and Cloudinary requirements - https://github.com/nax3t/image_upload_example
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

//root route
router.get("/", function(req, res){
    res.redirect("/shops");
});

// show register form
router.get("/register", function(req, res){
   res.render("register"); 
});

//handle sign up logic
router.post("/register", upload.single('dp'), function(req, res){
	if(req.file){
		cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
			if(err) {
				req.flash('error', err.message);
				return res.redirect('back');
			}
			// add cloudinary url for the image to the shop object under image property
			req.body.dp = result.secure_url;
			// create a new user
			var newUser = new User({
				email: req.body.email, 
				username: req.body.username, 
				dp: req.body.dp
			});
			if (req.body.adminCode === process.env.ADMINCODE){
				newUser.isAdmin = true;
			}
			User.register(newUser, req.body.password, function(err, user){
				if(err){
					req.flash("error", err.message);
					res.redirect("/register");
				}
				passport.authenticate("local")(req, res, function(){
					req.flash("success", "MedsNearMe welcomes you, " + user.username + '!');
					res.redirect("/shops"); 
				});
			});
		});
	}
	else{
		var newUser = new User({
			email: req.body.email, 
			username: req.body.username, 
		});
		if (req.body.adminCode === process.env.ADMINCODE){
			newUser.isAdmin = true;
		}
		User.register(newUser, req.body.password, function(err, user){
			if(err){
				req.flash("error", err.message);
				res.redirect("/register");
			}
			passport.authenticate("local")(req, res, function(){
				req.flash("success", "MedsNearMe welcomes you, " + user.username + '!');
				res.redirect("/shops"); 
			});
		});
	}
});
// router.post("/register", function(req, res){
	// var newUser = new User({
	// 	email: req.body.email, 
	// 	username: req.body.username, 
	// });
	// if (req.body.adminCode === process.env.ADMINCODE){
	// 	newUser.isAdmin = true;
	// }
	// if (req.body.dp){
	// 	newUser.dp = req.body.dp;
	// }
	// User.register(newUser, req.body.password, function(err, user){
	// if(err){
	// req.flash("error", err.message);
	// res.redirect("/register");
	// }
	// passport.authenticate("local")(req, res, function(){
	// 		req.flash("success", "MedsNearMe welcomes you, " + user.username + '!');
	// res.redirect("/shops"); 
	// });
	// });
// });

//show login form
router.get("/login", function(req, res){
   res.render("login"); 
});

//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/shops",
        failureRedirect: "/login",
		failureFlash: "An error occured. Either Sign Up or check your username/password."
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Logged you out");
   res.redirect("/shops");
});

// forgot password route
router.get("/forgot", function(req, res){
	res.render("forgot");
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'mdshadmancrj@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'mdshadman@medsnearme.org',
        subject: 'MedsNearMe Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account on MedsNearMe.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'mdshadmancrj@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'mdshadman@medsnearme.org',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account on MedsNearMe ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/shops');
  });
});

// USER PROFILE
router.get("/profile/:id", function(req, res){
	User.findById(req.params.id).exec(function(err, foundUser){
		if(err){
			req.flash("error", err);
		}
		else{
			Shops.find().where('author.id').equals(foundUser._id).exec(function(err, foundShops){
				if(err){
					req.flash("error", err);
				}
				res.render("profile", {user: foundUser, shops: foundShops});
			});
		}
	});
});

module.exports = router;