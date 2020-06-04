var express     	= require("express"),
    app         	= express(),
    bodyParser  	= require("body-parser"),
    mongoose    	= require("mongoose"),
	flash			= require("connect-flash"),
    passport    	= require("passport"),
    LocalStrategy 	= require("passport-local"),
	methodOverride 	= require("method-override"),
    Shops		  	= require("./models/shops"),
    Comment     	= require("./models/comment"),
    User        	= require("./models/user"),
    seedDB      	= require("./seeds");
    
//requring routes
var commentRoutes    = require("./routes/comments"),
    shopRoutes = require("./routes/shops"),
    indexRoutes      = require("./routes/index");
    
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.DATABASEURL, { useNewUrlParser: true, useCreateIndex: true });

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//seedDB(); // Seed the databse

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "The quick brown fox jumps right over the lazy dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

app.use("/", indexRoutes);
app.use("/shops", shopRoutes);
app.use("/shops/:id/comments", commentRoutes);

app.listen(process.env.PORT||3000, process.env.IP, function(){
   console.log("The YelpCamp Server Has Started!");
});