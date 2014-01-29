Hapi = require 'hapi'

module.exports = (BasePlugin) ->

	class HapiPlugin extends BasePlugin
		name: 'hapi'

		console.log(process.env.NODE_ENV);

		generateAfter: (opts, next) ->
			if not process.env.NODE_ENV? or process.env.NODE_ENV? and process.env.NODE_ENV isnt 'production' then return next()

			# Prepare
			docpad = @docpad
			docpadConfig = docpad.getConfig()
			wrench = require('wrench')
			path = require('path')
			config = @config
			staticPath = config.path or 'public_html'

			# Set out directory
			# the trailing / indicates to cp that the files of this directory should be copied over
			# rather than the directory itself
			outPath = path.normalize "#{docpadConfig.outPath}"
			staticPath = path.normalize "#{staticPath}"

			if outPath.slice(-1) is '/'
				staticPath.slice(0, -1)

			staticPath = path.join process.cwd(), staticPath

			wrench.copyDirRecursive outPath, staticPath, {forceDelete: true}, (err) ->
				return next(err) if err
				docpad.log "Done copying out folder to #{staticPath}"
				return next()

		serverAfter: (opts, next) ->
			# Get configs
			docpad = @docpad
			config = @config

			port = docpad.getConfig().port ? process.env.PORT ? process.env.VCAP_APP_PORT ? process.env.VMC_APP_PORT ? 9778

			port = parseInt(port,10)  if port and isNaN(port) is false

			hostname = docpad.getHostname()

			# Shutdown Express
			docpad.log('info', "Shutting down default Express server")
			docpad.destroyServer()

			# Require Hapi server and start
			server = require('../lib/hapi-server.js')(docpad, config, port, hostname)

			@server = server

			server.start ()->
				docpad.log('info', "Starting Hapi server on port #{port}")
				return next()