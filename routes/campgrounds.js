const express = require('express');
const router = express.Router();

const Campground = require('../models/campground');
const middleware = require("../middleware");

// index - show all campgrounds in one page
router.get("/", function(req, res){

    // res.render("campgrounds", {campgrounds:campgrounds});
    // get all campgrounds found in DB
    Campground.find({}, function(err, allCampgrounds){
      if(err){
        console.log(err);
      }else{
        res.render("campgrounds/index", {campgrounds:allCampgrounds});
      }
    })
});

router.post("/", middleware.isLoggedIn, function(req, res){
   //get data from form and add compgrounds
   var name = req.body.name;
   var price = req.body.price;
   var image = req.body.image;
   var desc  = req.body.description;
   var author = {
                   id: req.user._id,
                   username: req.user.username
                 };
   var newCampground = {name: name, price: price, image: image, description: desc, author: author}
   Campground.create(newCampground, function(err,newlyCreated){
     if(err){
       console.log(err);
     } else{
       res.redirect("/campgrounds");
     }
   })
   // campgrounds.push(newCampground);
});

router.get("/new", middleware.isLoggedIn, function(req, res) {
   res.render("campgrounds/new");
});

router.get("/:id", function(req, res){
  Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
    if(err || !foundCampground){
      req.flash("error", "Campground not found!");
      res.redirect("back");
    }else{
      console.log(foundCampground)
      res.render("campgrounds/show", {campground: foundCampground});
    }
  });
});

// edit campground route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err,foundCampground){
      res.render("campgrounds/edit", {campground: foundCampground});
    });
});

// update campground route
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
  Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
    if(err){
      res.redirect("/campgrounds");
    }else {
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});

// Destroy Campground Route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
  Campground.findByIdAndRemove(req.params.id, function(err){
    if(err){
      res.redirect("/campgrounds");
    }else {
      res.redirect("/campgrounds");
    }
  });
});




module.exports = router;
