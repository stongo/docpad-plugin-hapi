module.exports = function (BasePlugin) {
    // Define Plugin
    return BasePlugin.extend({
        name: 'hapi',
        generateAfter: function(opts, next) {
            if (!process.env.NODE_ENV || process.env.NODE_ENV && process.env.NODE_ENV !== 'production') {
                return next();
            }

            // Prepare
            var docpad = this.docpad;
            var docpadConfig = docpad.getConfig();
            var wrench = require('wrench');
            var path = require('path');
            var config = this.config;
            var staticPath = config.path || 'public_html';

            // Set out directory
            // the trailing / indicates to cp that the files of this directory should be copied over
            // rather than the directory itself
            var outPath = path.normalize(docpadConfig.outPath);
            staticPath = path.normalize(staticPath);

            if (outPath.slice(-1) === '/') {
                staticPath.slice(0, -1);
            }

            staticPath = path.join(process.cwd(), staticPath);

            wrench.copyDirRecursive(outPath, staticPath, {forceDelete: true}, function(err) {
                if (err) {
                    return next(err);
                }

                docpad.log('Done copying out folder to ' + staticPath);
                return next();
            });
        },
        serverAfter: function(opts, next) {
            // Get configs
            var docpad = this.docpad;
            var config = this.config;

            var port = docpad.getConfig().port || process.env.PORT || process.env.VCAP_APP_PORT || process.env.VMC_APP_PORT || 9778;

            if (port) {
                port = parseInt(port,10);
            }

            var hostname = docpad.getHostname();

            // Shutdown Express
            docpad.log('info', 'Shutting down default Express server');
            docpad.destroyServer();

            // Require Hapi server and start
            var server = require('../lib/hapi-server.js')(docpad, config, port, hostname);

            this.server = server;

            server.start(function() {
                docpad.log('info', 'Starting Hapi server on port' + port);
                return next();
            });

        }
    });
};
