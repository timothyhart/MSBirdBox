// config/passport.js
var app = require('../app');

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var bcrypt = require('bcrypt-nodejs');

// =========================================================================
// passport session setup ==================================================
// =========================================================================
// required for persistent login sessions
// passport needs ability to serialize and unserialize users out of session

// used to serialize the user for the session
app.passport.serializeUser(function(user, done) {
    done(null, user.id);
});

// used to deserialize the user
app.passport.deserializeUser(function(id, done) {
    app.dbConnection.query("SELECT * FROM users WHERE id = ? ",[id], function(err, rows){
        var user = {
            id: rows[0].id,
            email: rows[0].email
        };
        done(err, user);
    });
});

// =========================================================================
// LOCAL SIGNUP ============================================================
// =========================================================================
// we are using named strategies since we have one for login and one for signup
// by default, if there was no name, it would just be called 'local'

app.passport.use(
    'local-signup',
    new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        app.dbConnection.query("SELECT * FROM users WHERE email = ?",[email], function(err, rows) {
            if (err)
                return done(err);
            if (rows.length) {
                return done(null, false, req.flash('registerMessage', 'Email address "' + email + '" is already in use.'));
            } else {
                // if there is no user with that email
                // create the user
                var hashedPassword = bcrypt.hashSync(password, null, null);     // ???
                connection.query("INSERT INTO users ( email, password ) values (?,?)", [email, hashedPassword], function(err, rows) {
                    var user = {
                        id: rows.insertId,
                        email: email
                    };
                    return done(null, user);
                });
            }
        });
    })
);

// =========================================================================
// LOCAL LOGIN =============================================================
// =========================================================================
// we are using named strategies since we have one for login and one for signup
// by default, if there was no name, it would just be called 'local'

app.passport.use(
    'local-login',
    new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        app.dbConnection.query("SELECT * FROM users WHERE email = ?",[email], function(err, rows){
            if (err)
                return done(err);
            if (!rows.length) {
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
            }

            // if the user is found but the password is wrong
            //console.log(rows[0]);
            if (!bcrypt.compareSync(password, rows[0].password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            var user = {
                id: rows[0].id,
                email: rows[0].email
            };
            
            if (req.body.remember) {
                req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
                req.session.cookie.expires = false;
            }
    
            return done(null, user);
        });
    })
);

