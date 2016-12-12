var util = {
    isInteger: function(value) {
        return typeof value === "number" && isFinite(value) && !isNaN(value) && Math.floor(value) === value
    },
    
    sanitizeFileName: function(name) {
        var regexp = /[^a-zA-Z0-9-]/g;
        return name.replace(regexp, '_');
    },
    
    // extends 'from' object with members from 'to'. If 'to' is null, a deep clone of 'from' is returned
    // http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-an-object
    extend: function(from, to) {
        if (from == null || typeof from != "object") return from;
        if (from.constructor != Object && from.constructor != Array) return from;
        if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
            from.constructor == String || from.constructor == Number || from.constructor == Boolean)
            return new from.constructor(from);

        to = to || new from.constructor();

        for (var name in from)
        {
            to[name] = typeof to[name] == "undefined" ? util.extend(from[name], null) : to[name];
        }

        return to;
    },
    
    deepClone: function(obj) {
        return util.extend(obj, null);
    }
}

module.exports = util;

