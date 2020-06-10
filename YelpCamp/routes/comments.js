var express = require('express');
var router = express.Router({mergeParams:true});
var Comment = require("comment");
var campgroundDB = require("campgroundDB");

// middleware: check if the user logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()){
    return next();
  }
  req.flash("error", "Please login first");
  res.redirect("/login");
}
// middleware: check if the user is the author of a comment
function isAuthorized(req, res, next) {
  if (req.isAuthenticated()) {
    Comment.findById(req.params.comment_id, function (err, foundComment) {
      if(err) {req.flash("error", "This ID doesn't exist"); res.redirect('back')}
      else {
        if (foundComment.author.id.equals(req.user._id)) {
          next();
        } else {
          req.flash("error", "You don't have permission to do that");
          res.redirect('back')
        }
      }
    });
  } else {
    req.flash("error", "You don't have access to touch this");
    res.redirect('back')
  }
}

// create new comment(log in required)
router.get('/new', isLoggedIn, function (req, res) {
  campgroundDB.findById(req.params.id, function (err, cg) {
    if(err) {req.flash("error", "Something went wrong")} else {res.render('comments/new', {cg:cg})}
  });
});

// add the new comment to database(log in required)
router.post('/', isLoggedIn, function (req, res) {
  campgroundDB.findById(req.params.id, function (err, cg) {
    if(err) {console.log(err); res.redirect("/campgrounds");}
    else {
      var newComment = {text: req.body.text, author: req.body.author};
      Comment.create(newComment, function (err, nc) {
        if (err) {console.log(err)}
        else {
          // add username and id to comment
          nc.author.id = req.user._id;
          nc.author.username = req.user.username;
          nc.save();
          cg.comments.push(nc);
          cg.save();
          req.flash("success", "Successfully added a new comment")
          res.redirect('/campgrounds/' + cg._id);
        }
      });
    }
  });
});

// edit comment
router.get('/:comment_id/edit', isAuthorized, function (req, res) {
  campgroundDB.findById(req.params.id, function (err, cg) {
    if(err) {console.log(err); res.redirect("back")}
    else {
      Comment.findById(req.params.comment_id, function (err, cm) {
        if(err) {console.log(err); res.redirect("back")}
        else {
          res.render('comments/edit', {cg: cg, cm: cm});
        }
      })
    }
  })
});
// update comment
router.put('/:comment_id', isAuthorized, function (req, res) {
  Comment.findById(req.params.comment_id, function (err, foundData) {
    if (err) {console.log(err); res.redirect("back")}
    else {
      foundData.text = req.body.text;
      foundData.save();
      res.redirect('/campgrounds/' + req.params.id);
    }
  });
});

// destroy comment
router.delete('/:comment_id', isAuthorized, function (req, res) {
  Comment.findByIdAndDelete(req.params.comment_id, function (err) {
    if (err) {console.log(err)}
    req.flash("success", "You deleted a comment")
    res.redirect('/campgrounds/' + req.params.id);
  })
});

module.exports = router;