module.exports = function(req, res){
    res.render("page",
        {
            nav_compare: "active",
            partials: {
                body: "compare"
            }
        }
    );
};
