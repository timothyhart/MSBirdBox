var express = require('express');
var app = require("../app");
var router = express.Router();
var passport = app.passport;

// middleware to check for login - may be useful later, e.g. updating profile
// use like: app.get('/profile', isLoggedIn, function(req, res) {
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

// GET: /account/login
router.get('/login', function(req, res) {
    res.render("account/login", {
        message: req.flash('loginMessage')
    });
});

// POST: /account/login
router.post('/login', 
    passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/account/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }),
    function(req, res) {
        console.log("hello");

        if (req.body.remember) {
            req.session.cookie.maxAge = 1000 * 60 * 3;
        } else {
            req.session.cookie.expires = false;
        }
        //res.redirect('/');
    }
);

// GET: /account/register
router.get('/register', function(req, res) {
    res.render("account/register", {
        message: req.flash('registerMessage')
    });
});

// POST: /account/register
router.post('/register',
    passport.authenticate('local-signup', {
		successRedirect : '/', // redirect to the secure profile section
		failureRedirect : '/account/register', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
    })
);

module.exports = router;
