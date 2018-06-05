const express = require('express');
const router = express.Router();
const NodeGeocoder = require("node-geocoder");

const Campground = require('../models/campground');
const middleware = require("../middleware");

var options = {
  provider: "google",
  httpAdapter: "https",
  apiKey: process.env.GEOCODE_API_KEY,
  formatter: null
};

var geocoder = NodeGeocoder(options);


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

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var price = req.body.price;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {name: name, image: image, price: price, description: desc, author:author, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            // console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });
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

    geocoder.geocode(req.body.location, function(err, data){
      if(err || !data.length){
        req.flash("error", "Invalid address");
        res.redirect("/campgrounds");
      }

      req.body.campground.lat = data[0].latitude;
      req.body.campground.lng = data[0].longitude;
      req.body.campground.location = data[0].formattedAddress;

      Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
          req.flash("error", err.message);
          res.redirect("back");
        } else {
          req.flash("success", "Successfully Updated!");
          res.redirect("/campgrounds/" + updatedCampground._id);
        }
    });
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
