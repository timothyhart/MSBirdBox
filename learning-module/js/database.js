function Database() {
    this.birds = {};
}

Database.prototype.load = function ()
{
    var baseUrl = "../prototype/public/database";
    var listUrl = "../prototype/Admin-panel/exportdata.php";
    var birds = this.birds;
    $.getJSON(listUrl, function (data) {
        $.each(data, function (key, value) {
            // temporary rename until these field names are synced w/ database
	    //console.log(value.clip)
            var origClipName = value.clip;
            origClipName = origClipName.replace("mp3", "ogg");
            value.id = value.birdID;
            value.photo = baseUrl + "/photos/" + value.photo;
            value.clip = baseUrl + "/clips/" + origClipName;
            value.spectrogram = baseUrl + "/spectrograms/" + origClipName + ".png";
            birds[value.id] = value;
	});
    });
}

Database.prototype.getBirdById = function(id)
{
    return this.birds[id];
}

Database.prototype.getBirdsForLevel = function(level)
{
    var birdList = g_database.getBirdList();
    birdList = birdList.slice(level * 6, level * 6 + 6);
    return birdList;
}

// Returns a _new_ list of birds. Feel free to modify it, it won't affect the database.
Database.prototype.getBirdList = function()
{
    var birdList = [];
    $.each(this.birds, function (key, value) {
        birdList.push(value);
    });
    return birdList;
}

