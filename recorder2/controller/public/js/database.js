function Database() {
    this.birds = {};
    this.commonBirds = {};
    this.isLoaded = false;
}

// Second param of callback is exception/error
Database.prototype.load = function (callback) {
    if (this.isLoaded) {
        if (callback)
            callback(false);
        
        return;
    }

    var instance = this;
    
    $.getJSON(CENTRAL_DATABASE_JSON_URL, function (data) {
        $.each(data, function (key, value) {
            // temporary rename until these field names are synced w/ database
            var origClipName = value.trophycall;
            value.id = value.birdID;
            value.photo = CENTRAL_DATABASE_BASE_URL + "/photos/" + value.photo;
            value.clip = CENTRAL_DATABASE_BASE_URL + "/clips/" + origClipName;
            value.spectrogram = CENTRAL_DATABASE_BASE_URL + "/spectrograms/" + origClipName + ".png";
            instance.birds[value.id] = value;
        });

        // Load common birds too
        $.getJSON(CENTRAL_DATABASE_COMMONBIRDS_URL, function(data) {
            $.each(data, function(key, value) {
                var birdId = value.birdID;
                if (instance.birds[birdId] === undefined) {
                    console.warn("Invalid common bird id", birdId);
                    return;
                }

                instance.commonBirds[birdId] = instance.birds[birdId];
            });

            instance.isLoaded = true;
            if (callback)
                callback(false);
        });
    });
}

Database.prototype.getBirdById = function(id) {
    return this.birds[id];
}

// Returns a _new_ list of birds. Feel free to modify it, it won't affect the database.
Database.prototype.getBirdList = function() {
    var birdList = [];
    $.each(this.birds, function (key, value) {
        birdList.push(value);
    });
    return birdList;
}

// Get common bird list. If shuffle is set, returns a new list that is shuffled.
Database.prototype.getCommonBirdList = function(shuffle, limit) {
    var list = [];
    $.each(this.commonBirds, function(key, value) {
        list.push(value);
    });

    if (shuffle)
        shuffleArray(list);
    
    if (limit !== undefined)
        list = list.slice(0, limit);

    return list;
}

