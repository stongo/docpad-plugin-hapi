// Declare internals

var internals = {};


// Plugin registration

exports.register = function (plugin, options, next) {

    var err = {
        message: 'test2'
    }

    if (err) return next(err);

    return next();
};

