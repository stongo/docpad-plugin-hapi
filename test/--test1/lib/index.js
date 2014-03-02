// Declare internals

var internals = {};


// Plugin registration

exports.register = function (plugin, options, next) {

    plugin.route({ path: '/test1', method: 'GET', handler: function (request, reply) { reply('test'); } });
    plugin.expose(internals.math);
    plugin.expose('glue', internals.text.glue);

    return next();
};


internals.math = {
    add: function (a, b) {

        return a + b;
    }
};


internals.text = {
    glue: function (a, b) {

        return a + b;
    }
};


