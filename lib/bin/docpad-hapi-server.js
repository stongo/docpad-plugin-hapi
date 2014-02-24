// Require
var DocPad = require('docpad');
var Async = require('async');

// Prepare
var getArgument = function(name, value, defaultValue) {

	var name = name;
	var value = value || null;
	var defaultValue = defaultValue || null;
	var result = defaultValue
	var argumentIndex = process.argv.indexOf('--//{name}');

	if (argumentIndex !== -1) {
		result = value || process.argv[argumentIndex+1];
	}

	return result;
};

// DocPad Action
var action = getArgument('action', null, 'generate')

// DocPad Configuration
var docpadConfig = {}

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
		function(next) {
			config = if docpad.getConfig().plugins?.hapi? then docpad.getConfig().plugins.hapi else {}

			port = process.env.PORT ? config.port ? process.env.VCAP_APP_PORT ? process.env.VMC_APP_PORT ? 9778

			port = parseInt(port,10)  if port and isNaN(port) is false

			hostname = process.env.HOSTNAME ? config.hostname ? null

			// Require Hapi server and start
			server = require('../../lib/hapi-server.js')(docpad, config, port, hostname)

			server.start ()->
				console.log("Starting Hapi server on port //{port}")
				return next()
		}

		// Generate
		(next) ->
			docpad.action action, (err) ->
				// Check
				return console.log(err.stack) if err
				return next()
	])
});