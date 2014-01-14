module.exports = function(docpad, settings, port, hostname) {

    var Hapi = require('hapi');

    // Declare internals

    var internals = {};

    internals.settings = settings || {};

    internals.port = port || 9778;

    internals.hostname = hostname || '0.0.0.0';

    internals.serverConfig = {
        files: {
            relativeTo: process.cwd()
        },
        cache: {
            engine: 'memory'
        }
    };

    // Initiate Server

    var server = new Hapi.Server(internals.port, internals.serverConfig);

    // Pre Handler
    // Query .docpad.db before serving static file

    var readDatabase = function(request, reply) {

        // Query DB

        // Serve Document

        // If no document, then exit early

        internals.serveDocument = function(document) {
            if (!document) {
               return reply('foo');
            }

            // Content Type

            var contentType = document.outContentType || document.contentType;

            // Return content from DB

            var content = document.getOutContent();

            if (content) {
                return reply.file(content);
            }
            else {
                return reply();
            }
        };

        if (request.params.file.indexOf('/') !== 0) {
            var filePath = '/' + request.params.file;
        }

        docpad.getFileByRoute(filePath, function(err,file) {

            // Check

            if (err || !file) {
                return reply();
            }

            // Check if we are the desired url
            // if we aren't do a permanent redirect

            var url = file.get('url');
            var cleanUrl = docpad.getUrlPathname(url);

            if ((url !== cleanUrl) && (url !== request.params.file)) {
                return reply.redirect(url);
            }

            // Serve the file to the user

            internals.serveDocument(file);
        });

    };


    // Main route for serving site

    internals.routes = [];

    var staticRoute = {
        method: 'GET',
        path: '/{file*}',
        handler: {
            directory: {
                path: 'public_html/'
            }
        },
        config: {
            cache: {
                expiresIn: 60000 * 60 * 3
            },
            pre: [{
                method: readDatabase,
                assign: 'queryEngine'
            }]
        }
    };

    internals.routes.push(staticRoute);

    if (typeof internals.settings.routes === 'array' && internals.settings.routes.length > 0) {
        internals.routes.push.apply(internals.routes, internals.settings.routes);
    }

    server.route(internals.routes);

    return server;

};