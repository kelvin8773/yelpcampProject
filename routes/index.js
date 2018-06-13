const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require("../models/user");



router.get("/", function(req, res){
    res.render("landing");
});



// show register form
router.get("/register", function(req,res){
  res.render("register");
});

// handle sign up logic
router.post("/register", function(req, res){

  var newUser = new User({
      username:   req.body.username,
      firstName:  req.body.firstName,
      lastName:   req.body.lastName,
      avatar:     req.body.avatar,
      email:      req.body.email
        });

  if(req.body.adminCode === process.env.ADMIN_SECRET_CODE) {
    newUser.isAdmin = true;
  };

  User.register(newUser, req.body.password, function(err, user){
    if(err){
      console.log(err);
      req.flash("error", err.message);
      res.redirect("/register");
    };

      passport.authenticate("local")(req, res, function(){
        req.flash("success", "Succcessful Signed Up! Welcome to Yelpcamp, " + req.body.firstName + " " + req.body.lastName + " !!!");
        res.redirect("/campgrounds");
      });

  });
});



// show login form

router.get("/login", function(req, res){
  res.render("login");
});

router.post("/login", passport.authenticate("local",
      {
          successRedirect: "/campgrounds",
          failureRedirect: "/login"
      }),function(req, res){
        req.flash("success", "You have logged in!");
});

// logout route

router.get("/logout", function(req, res){
  req.logout();
  req.flash("success","Logged you out!");
  res.redirect("/campgrounds");
});





module.exports = router;
