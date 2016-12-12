var app = require('../app');
var express = require('express');
var router = express.Router();

// GET: /api/session
router.get('/session', function(req, res) {
    // Populate state.
    var state = {};
    state.loggedIn = req.isAuthenticated();
    if (state.loggedIn) {
        state.email = req.user.email;
    }

    res.json(state);
});

// GET: /api/birdskill
router.get('/birdskill', function(req, res) {
    if (!req.isAuthenticated()) {
        throw new Error("Not authenticated");
    }
    
    app.dbConnection.query("SELECT * FROM birdskill WHERE userid = ?", [req.user.id],
        function(err, rows) {
            if (err) {
                throw new Error(err);
            }
            
            var data = [];
            for (var i = 0; i < rows.length; i++) {
                data.push({
                    birdId: rows[i].birdid,
                    skill: rows[i].skill
                });
            }
            
            res.json(data);
        }
    );            
});

// POST: /api/birdskill
router.post('/birdskill', function(req, res) {
    if (!req.isAuthenticated()) {
        throw new Error("Not authenticated");
    }
    
    // TODO: Check validity of bird ids...
    var birdId = req.body.birdId;
    var skill = req.body.skill;
    app.dbConnection.query("REPLACE INTO birdskill VALUES(?, ?, ?)", [req.user.id, birdId, skill]);
    res.sendStatus(200);
});

// TODO: Achievements


module.exports = router;
