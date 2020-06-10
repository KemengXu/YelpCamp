var express = require('express');
var router = express.Router();
var passport = require("passport");
var LocalStrategy = require("passport-local");
var User = require("user");
var seed = require("seed");
seed();  // some sample data

// setting up about authentication
router.use(require("express-session")({
  secret: "SECRET",
  resave: false,
  saveUninitialized: false
}));
router.use(passport.initialize());
router.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
router.use(function (req, res, next) {
  res.locals.currUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

// home page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'YelpCamp' });
});

// ====================
// Authenticate routes
// ====================
// show the sign up page
router.get('/register', function (req, res) {
  res.render('user/register');
});

// add new user data to the database
router.post('/register', function (req, res) {
  var newUser = new User({username:req.body.username});
  User.register(newUser, req.body.password, function (err, user) {
    if(err){req.flash("error", err.message); return res.redirect('/register')}
    passport.authenticate("local")(req, res, function () {
      req.flash("success", "Welcome to YelpCamp, " + user.username);
      res.redirect('/campgrounds');
    });
  });
});

// show login form
router.get('/login', function (req, res) {
  res.render('user/login');
});

// authenticate the login info
router.post('/login', passport.authenticate("local",
    {successRedirect: "/campgrounds", failureRedirect:"/login"}),
    function (req, res) {
});

// logout
router.get('/logout', function(req, res){
  req.logout();
  req.flash("success", "You logged out!")
  res.redirect("/campgrounds");
});

module.exports = router;
