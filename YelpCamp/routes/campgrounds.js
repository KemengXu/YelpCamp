var express = require('express');
var router = express.Router();
var campgroundDB = require("campgroundDB");

// middleware: check if the user logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()){
    return next();
  }
  req.flash("error", "Please login first");
  res.redirect("/login");
}

// middleware:
function isAuthorized(req, res, next) {
  if (req.isAuthenticated()){
    campgroundDB.findById(req.params.id, function (err, foundCampground) {
      if(err) {req.flash("error", "This ID doesn't exist"); res.redirect('back')}
      else {
        if(foundCampground.author.id.equals(req.user._id)){
          next();
        } else {
          req.flash("error", "You don't have permission to do that");
          res.redirect('back');
        }
      }
    });
  } else {
    req.flash("error", "You don't have access to touch this");
    res.redirect("back");
  }
}

// show all campgrounds
router.get('/', function(req, res){
  campgroundDB.find({}, function (err, allCampgrounds) {
    if (err) {console.log("error when finding data")}
    else {res.render("campgrounds/campgrounds", {campgrounds: allCampgrounds});}
  });
});

// add new campground to database
router.post("/", isLoggedIn, function (req, res) {
  // get data from form and add to campgroundDB
  // redirect back to the campgrounds page
  var name = req.body.name;
  var price = req.body.price;
  var image = req.body.image;
  var description = req.body.description;
  var author = {
    id: req.user._id,
    username: req.user.username
  };
  var newCg = {name: name, price: price, image:image, description:description, author: author}
  campgroundDB.create(newCg, function (err, newData) {
    if (err) {console.log(err);} else {console.log("inserted new data: "); console.log(newData)}
  });
  req.flash("success", "Successfully added a new campground")
  res.redirect("/campgrounds");
});

// user create a new campground
router.get("/new", isLoggedIn, function (req, res) {
  res.render("campgrounds/new");
});

// show details of the specific campground
// this need to come after /new otherwise it will treat new as an id
router.get("/:id", function (req, res) {
  campgroundDB.findById(req.params.id).populate("comments").exec(function (err, data) {
    if(err) {console.log(err)} else {res.render("campgrounds/show", {cg: data});}
  });
});

// edit
router.get('/:id/edit', isAuthorized, function (req, res) {
    campgroundDB.findById(req.params.id, function (err, foundCampground) {
      res.render('campgrounds/edit', {cg: foundCampground})
    });
});
// update
router.put('/:id', isAuthorized, function (req, res) {
  var data = {name: req.body.name, price: req.body.price,image: req.body.image, description: req.body.description}
  campgroundDB.findByIdAndUpdate(req.params.id, data, function (err, updatedCg) {
    if (err) {console.log(err); res.redirect('/campgrounds')}
    else {res.redirect('/campgrounds/' + req.params.id)}
  })
});

// destroy
router.delete('/:id', isAuthorized, function (req, res) {
  campgroundDB.findByIdAndRemove(req.params.id, function (err) {
    if(err){console.log(err)}
    req.flash("success", "You deleted a campground")
    res.redirect('/campgrounds')
  })
});
module.exports = router;