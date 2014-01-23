# Require
DocPad = require('docpad')
Async = require('async')

# Prepare
getArgument = (name,value=null,defaultValue=null) ->
	result = defaultValue
	argumentIndex = process.argv.indexOf("--#{name}")
	if argumentIndex isnt -1
		result = value ? process.argv[argumentIndex+1]
	return result

# DocPad Action
action = getArgument('action', null, 'generate')

# DocPad Configuration
docpadConfig = {}
docpadConfig.port = (->
	port = getArgument('port')
	port = parseInt(port,10)  if port and isNaN(port) is false
	return port
)()

# Create DocPad Instance
DocPad.createInstance docpadConfig, (err,docpad) ->
	# Check
	return console.log(err.stack)  if err

	Async.parallel([
		# Start Hapi Server
		(next) ->
			config = docpad.getConfig()

			port = process.env.PORT ? config.port ? process.env.VCAP_APP_PORT ? process.env.VMC_APP_PORT ? 9778

			port = parseInt(port,10)  if port and isNaN(port) is false

			hostname = process.env.HOSTNAME ? config.hostname ? null

			# Require Hapi server and start
			server = require('../../lib/hapi-server.js')(docpad, config, port, hostname)

			server.start ()->
				console.log("Starting Hapi server on port #{port}")
				return next()

		# Generate
		(next) ->
			docpad.action action, (err) ->
				# Check
				return console.log(err.stack) if err
				return next()
	])