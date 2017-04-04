// Constants
var TIER_TO_UNLOCK_NEXT_LEVEL = 3;
var POINTS_PER_TIER = 10;

function Stats() {
    this.isLoggedIn = false;
    this.birdSkill = {};
}

Stats.prototype.load = function () {
    var stats = this;
    
    // Hide login boxes for now
    $("#login-nav-box").hide();
    $("#nologin-nav-box").hide();
    
    // Get current login state.
    $.getJSON("/api/session", function(result) {
        //console.log(result);
        if (result.loggedIn) {
            // We are logged in.
            // User id is deliberately kept only to the server.
            $("#login-nav-box").show();
            $("#login-nav-box .login-name").text(result.email);
            stats.loadBirdSkills();
        } else {
            $("#nologin-nav-box").show();
        }
    })
    .fail(function(error) {
        alert("Failed to load session information. Progress will not be saved.");
    });
}

Stats.prototype.loadBirdSkills = function() {
    var stats = this;
    
    $.getJSON("/api/birdskill", function(result) {
        console.log(result);
        for (var i = 0; i < result.length; i++) {
            stats.birdSkill[result[i].birdId] = result[i].skill
        }
    }).fail(function(error) {
        alert("Failed to load session information. Progress will not be saved.");
    });
}

Stats.prototype.uploadBirdSkill = function(birdId, skill) {
    $.ajax({
        url: "/api/birdskill",
        type: "post",
        data: {
            birdId: birdId,
            skill: skill
        },
        success: function(result) {
            console.log("bird " + birdId + " skill updated to " + skill);
        }
    });
}

Stats.prototype.getSkillForBird = function (id) {
    var skillLevel = this.birdSkill[id];
    return (skillLevel) ? skillLevel : 0;
}

Stats.prototype.hasSkillLevelForBird = function (id, requiredLevel) {
    var skillLevel = this.birdSkill[id];
    if (!skillLevel)
        skillLevel = 0;

    return (skillLevel >= requiredLevel);
}

Stats.prototype.hasSkillLevelForBirdsAtLevel = function(birdLevel, skillLevel)
{
    var birdList = g_database.getBirdsForLevel(birdLevel);
    
    // .is() return true for any, we want a .all essentially, but that doesn't exist.
    for (var i = 0; i < birdList.length; i++) {
        if (!this.hasSkillLevelForBird(birdList[i].id, skillLevel))
            return false;
    }

    return true;
}

Stats.prototype.getTierForSubLevel = function(subLevel)
{
    var tier = 0;
    switch (subLevel)
    {
        case 0: tier = 0; break;
        case 1: tier = 1; break;
        case 2: tier = 1; break;
        case 3: tier = 2; break;
        case 4: tier = 2; break;
        case 5: tier = 3; break;
    }

    return tier;
}

Stats.prototype.getPointsToUnlockTier = function(tier)
{
    return (tier + 1) * POINTS_PER_TIER;
}

// Add skill points for a bird, playing at a tier/sublevel. Returns true if points were added.
Stats.prototype.addSkillPointsForBird = function(birdId, subLevel, attemptCount)
{
    var tier = this.getTierForSubLevel(subLevel);

    // Skill points to add = 10 / attempt count, capped at 10 * tier
    var pointsToAdd = Math.floor(10 / attemptCount);
    var pointsCap = (tier + 1) * POINTS_PER_TIER;

    // Check against undefined
    var currentPoints = this.birdSkill[birdId];
    if (!currentPoints)
        currentPoints = 0;

    // Store new points, but don't add when already over cap
    if (currentPoints < pointsCap) {
        console.log("add", currentPoints, " + ", pointsToAdd, "skill points for bird", birdId);

        var newSkillPoints = currentPoints + pointsToAdd;
        if (newSkillPoints >= pointsCap)
            newSkillPoints = pointsCap;
        
        if (newSkillPoints != currentPoints) {
            this.birdSkill[birdId] = newSkillPoints;
            this.uploadBirdSkill(birdId, newSkillPoints);
        }
        
        return true;
    } else {
        return false;
    }            
}
