# Require
DocPad = require('docpad')

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

	# Start Hapi Server
	(->
		config = docpad.getConfig()

		port = config.port ? process.env.PORT ? process.env.VCAP_APP_PORT ? process.env.VMC_APP_PORT ? 9778

		hostname = config.hostname ? process.env.HOSTNAME ? null

		# Require Hapi server and start
		server = require('../../lib/hapi-server.js')(docpad, config, port, hostname)

		server.start ()->
			console.log("Starting Hapi server on port #{port}")
	)()

	# Generate and Serve
	docpad.action action, (err) ->
		# Check
		return console.log(err.stack)  if err

		return
		# Done
