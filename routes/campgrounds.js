const express = require('express');
const router = express.Router();
const NodeGeocoder = require("node-geocoder");

const Campground = require('../models/campground');
const middleware = require("../middleware");

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
  cloud_name: 'kledu188833',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


var options = {
  provider: "google",
  httpAdapter: "https",
  apiKey: process.env.GOOGLE_GEOCODE_API_KEY,
  formatter: null
};

var geocoder = NodeGeocoder(options);

//INDEX - show all campgrounds
router.get("/", function(req, res){
    var perPage = 9;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count({name: regex}).exec(function (err, count) {
                if (err) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(allCampgrounds.length < 1) {
                        noMatch = "No campgrounds match that query, please try again.";
                    }
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        // get all campgrounds from DB
        Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});



//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){

  geocoder.geocode(req.body.campground.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }

    // add author to campground
    req.body.campground.author = {
      id: req.user._id,
      username: req.user.username
    };

    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;


 if (req.body.campground.image_url === "" || req.body.campground.image_url === null) {
    cloudinary.uploader.upload(req.file.path, function(result) {
        // add cloudinary url for the image to the campground object under image property
        req.body.campground.image = result.secure_url;

        Campground.create(req.body.campground, function(err, campground) {
          if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
          }
          res.redirect('/campgrounds/' + campground.id);
        });


      });
    } else {

      req.body.campground.image = req.body.campground.image_url;

      Campground.create(req.body.campground, function(err, campground) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/campgrounds/' + campground.id);
      });

    }



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

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
