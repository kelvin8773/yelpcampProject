const express = require('express');
const router = express.Router();

const passport = require('passport');
const User = require("../models/user");
const Campground = require("../models/campground");
const middleware = require("../middleware");

// Admin Page
router.get("/:id/admin", middleware.checkAdminOwnership, function(req, res){
  Campground.find(function(err, allCampgrounds) {
    if (err) {
        req.flash("error", err.message);
        res.redirect("back");
    } else {
      User.find(function(err, allUsers){
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
          } else {
          return res.render("users/admin", {campgrounds: allCampgrounds, users: allUsers});
        }
      });
    }
    
  });
});


// User public profile (Show Page)
router.get("/:id", function(req, res){
  User.findById(req.params.id, function(err, foundUser){
    if (err) {
      req.flash("error", "Can't fine the User!");
      return res.redirect("back");
    }
    Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds) {
      if (err) {
        req.flash("error", "Something is wrong, please check with our support!");
        return res.redirect("back");
      }
      res.render("users/show", {user: foundUser, campgrounds: campgrounds});
    })
  });
});


// User Personal Profile (update Personal Detail)

router.get("/:id/edit", middleware.checkUserOwnership, function(req, res){
    User.findById(req.params.id, function(err,foundUser){
      if (err) {
        req.flash("error", "Something went wrong.");
        return res.redirect("back");
      }
      Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds) {
        if (err) {
          req.flash("error", "Something went Wrong!");
          return res.redirect("back");
        }
        res.render("users/edit", {user: foundUser, campgrounds: campgrounds});
      })
    });
});


// update User Info
router.put("/:id", middleware.checkUserOwnership, function(req, res){
  User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
        if(err){
          req.flash("error", err.message);
          res.redirect("back");
        } else {
          req.flash("success", "Successfully Updated!");
          return res.redirect("/users/" + updatedUser._id);
        }
    });
});


module.exports = router;
