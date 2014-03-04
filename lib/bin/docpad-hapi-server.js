// Require
var DocPad = require('docpad');
var Async = require('async');

// Prepare
var getArgument = function(name, value, defaultValue) {

    var value = value || null;
    var defaultValue = defaultValue || null;
    var result = defaultValue;
    var argumentIndex = process.argv.indexOf('--//{name}');

    if (argumentIndex !== -1) {
        result = value || process.argv[argumentIndex+1];
    }

    return result;
};

// DocPad Action
var action = getArgument('action', null, 'generate');

// DocPad Configuration
var docpadConfig = {};

docpadConfig.port = (function() {

    var port = getArgument('port');

    if (port) {
        port = parseInt(port,10);
    }

    return port;
})();

// Create DocPad Instance
DocPad.createInstance(docpadConfig, function(err,docpad) {
    // Check
    if (err) {
        return console.log(err.stack);
    }

    Async.parallel([
        // Start Hapi Server
        function (next) {
            var config = docpad.getConfig().plugins && docpad.getConfig().plugins.hapi ? docpad.getConfig().plugins.hapi : {};

            var port = process.env.PORT ||
                config.port ||
                process.env.VCAP_APP_PORT ||
                process.env.VMC_APP_PORT ||
                9778;

            if (port) {
                port = parseInt(port,10);
            }

            var hostname = process.env.HOSTNAME ||
                config.hostname ||
                null;

            // Require Hapi server and start
            var server = require('../hapi.server.js')(docpad, config, port, hostname);

            server.start(function() {
                console.log('Starting Hapi server on port ' + port);
                return next();
            });
        },
        // Generate
        function (next) {
            docpad.action(action, function (err) {

                // Check
                if (err) {
                    return console.log(err.stack);
                }

                return next();

            });
        }
    ]);
});