module.exports = function(req, res){
    res.render("page",
        {
            nav_database: "active",
            partials: {
                body: "database"
            }
        }
    );
};
