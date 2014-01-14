Hapi = require 'hapi'

module.exports = (BasePlugin) ->

	class HapiPlugin extends BasePlugin
		name: 'hapi'

		config = docpad.getConfig()
		hapiConfig = config.plugins.hapi

		generateAfter: (opts, next) ->
			# Prepare
			docpad = @docpad
			docpadConfig = docpad.getConfig()
			wrench = require('wrench')
			path = require('path')
			config = @config
			staticPath = config.path or defaults.path

			# Set out directory
			# the trailing / indicates to cp that the files of this directory should be copied over
			# rather than the directory itself
			outPath = path.normalize "#{docpadConfig.outPath}"
			staticPath = path.normalize "#{staticPath}"

			if outPath.slice(-1) is '/'
					staticPath.slice(0, -1)

			staticPath = path.join process.cwd(), staticPath

			docpad.log "debug", "Copying out folder. outPath: #{outPath}, staticPath: #{staticPath}"

			wrench.copyDirRecursive outPath, staticPath, {forceDelete: true}, (err) ->
					return next(err) if err
					docpad.log "Done copying out folder to #{staticPath}"
					return next()

		serverAfter: (opts, next) ->
			# Get configs
			docpad = @docpad
			config = opts
			port = docpad.getPort()
			hostname = docpad.getHostname()

			# Shutdown Express
			docpad.log('info', "Shutting down default Express server")
			docpad.destroyServer()

			# Require Hapi server and start
			server = require('../lib/hapi-server.js')(docpad, config, port, hostname)

			@server = server

			server.start ()->
				docpad.log('info', "Starting Hapi server")
				return next()