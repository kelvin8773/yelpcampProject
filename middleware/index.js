const Campground  = require("../models/campground");
const Comment     = require("../models/comment");
const User        = require("../models/user");

const middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
          if(err || !foundCampground){
            req.flash("error", err);
            res.redirect("back");
          }else {
            if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
              next();
            } else {
              req.flash("error", "You don't have permission to do that!");
              res.redirect("back");
              }
            }
          });
        }
    else {
      req.flash("error", "You need to be logged in to do this!");
      res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next){
  if(req.isAuthenticated()){
      Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err || !foundComment){
          req.flash("error", "Something went wrong!");
          res.redirect("back");
        }else {
          if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
            next();
          } else {
            req.flash("error", "You don't have permission to do this!");
            res.redirect("back");
            }
          }
        });
      }
  else {
    req.flash("error", "You need to be logged in to do this!");
    res.redirect("back");
  }
}


middlewareObj.checkUserOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        User.findById(req.params.id, function(err, foundUser){
          if(err || !foundUser){
            req.flash("error", err.message);
            res.redirect("back");
          }else {
            if(foundUser._id.equals(req.user._id) || req.user.isAdmin ){
              next();
            } else {
              req.flash("error", "You don't have permission to do that!");
              res.redirect("/users/" + foundUser._id);
              }
            }
          });
        }
    else {
      req.flash("error", "You need to be logged in to do this!");
      res.redirect("/campgrounds");
    }
}


middlewareObj.checkAdminOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        User.findById(req.params.id, function(err, foundUser){
          if(err || !foundUser){
            req.flash("error", "What Happen?");
            res.redirect("back");
          }else {
            if(foundUser.isAdmin){
              next();
            } else {
              req.flash("error", "You don't have permission to do that!");
              res.redirect("/campgrounds");
              }
            }
          });
        }
    else {
      req.flash("error", "You need to logIn first!");
      res.redirect("/campgrounds");
    }
}



middlewareObj.isLoggedIn = function(req, res, next) {
  if(req.isAuthenticated()){
    return next();
  }
  req.flash("error", "You need to be logged in to do this!");
  res.redirect("/login");
}


module.exports = middlewareObj;
