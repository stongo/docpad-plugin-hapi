module.exports = function(docpad, settings, port, hostname) {

    var Hapi = require('hapi');
    var Util = require('hoek');
    var Async = require('async');


    // Declare internals

    var internals = {};

    internals.settings = settings || {};

    internals.port = port || 9778;

    internals.hostname = hostname || '0.0.0.0';

    internals.defaultServerConfig = {
        files: {
            relativeTo: process.cwd()
        }
    };


    // Set server config

    internals.serverConfig = internals.settings.config ? Util.applyToDefaults(internals.defaultServerConfig, internals.settings.config) : internals.defaultServerConfig;


    // Get docpad config

    var docpadConfig = docpad.getConfig();

    internals.maxAge = docpadConfig.maxAge || 86400000; // default docpad value


    // Initiate Server

    var server = new Hapi.Server(internals.hostname, internals.port, internals.serverConfig);


    // Assign docpad as server.app property for plugin use

    server.app.docpad = docpad;


    // Add plugins

    if (typeof internals.settings.plugins === 'object' ||
        typeof internals.settings.plugins === 'array') {

            Async.map(internals.settings.plugins, function(plugin, callback) {

                // Set label from Object key
                plugin.label = Object.keys(plugin)[0];

                // Check if plugin exists
                try {
                    require.resolve(plugin[plugin.label].require);
                } catch(err) {
                    return callback('Hapi plugin "' + plugin.label + '" not found');
                }

                // Add plugin to server
                plugin.options = plugin.options || null;
                server.pack.require(plugin[plugin.label].require, plugin[plugin.label].options, function(err) {
                    if (err) {
                        return callback('Problem loading Hapi plugin "' + plugin.label + '". Error: "' + err.message + '"');
                    }

                    return callback(null, plugin.label);
                });

            },
            function(err, enabled) {
                if (err) {
                    docpad.log('warn', err);
                }
                var enabledPlugins = enabled.join(', ');
                return docpad.log('info', 'Loaded Hapi plugins: ' + enabledPlugins);

            });
    }



    // Pre Handler
    // Query .docpad.db before serving static file

    var readDatabase = function(request, reply) {

        // Query DB

        // Serve Document

        // If no document, then exit early

        internals.serveDocument = function(document) {

            if (!document) {
               return reply();
            }

            // Content Type

            var contentType = document.get('outContentType') || document.get('contentType');

            // Return content from DB

            var content = document.getOutContent();

            if (content) {
                //ETag
                var ctime = document.get('date');
                var mtime = document.get('wtime').toString().replace(/\D/g,'');
                var stat = document.getStat();
                var lastModifiedDb = document.get('mtime').toUTCString();

                var etag = '"' + stat.size + '-' + Number(mtime) + '"';

                if (request.headers['if-none-match'] &&
                    request.headers['if-none-match'] === etag) {

                        return reply(null).code(304).ttl(internals.maxAge).takeover();
                }

                var ifModifiedSinceHeader = request.headers['if-modified-since'];

                if (ifModifiedSinceHeader &&
                    lastModifiedDb) {
                        var ifModifiedSince = Date.parse(ifModifiedSinceHeader);
                        var lastModified = Date.parse(lastModifiedDb);

                        if (ifModifiedSince &&
                            lastModified &&
                            ifModifiedSince >= lastModified) {

                            return reply(null).code(304).ttl(internals.maxAge).takeover();
                        }
                }

                return reply(content).header('content-type', contentType).header('ETag', etag).ttl(internals.maxAge).header('last-modified', lastModifiedDb).takeover();
            }
            else {
                return reply();
            }
        };

        var filePath = request.params.file.indexOf('/') !== 0 ? '/' + request.params.file : request.params.file;

        docpad.getFileByRoute(filePath, function(err,file) {

            // Check

            if (err ||
                !file) {

                    return reply();
            }

            // Check if we are the desired url
            // if we aren't do a permanent redirect

            var url = file.get('url');
            var cleanUrl = docpad.getUrlPathname(url);

            if (url !== cleanUrl &&
                url !== request.params.file) {

                    return reply().redirect(url);
            }

            // Serve the file to the user

            internals.serveDocument(file);
        });

    };


    // Main route for serving site

    internals.routes = [];

    internals.staticPath = process.env.NODE_ENV === 'production' ? process.cwd() + '/public_html/' : docpadConfig.outPath + '/';

    internals.defaultExtension = internals.settings.defaultExtension || 'html';

    console.log('internals.defaultExtension: ' + internals.defaultExtension);

    var staticRoute = {
        method: 'GET',
        path: '/{file*}',
        handler: {
            directory: {
                path: internals.staticPath,
                redirectToSlash: false,
                defaultExtension: internals.defaultExtension
            }
        },
        config: {
            cache: {
                expiresIn: internals.maxAge,
                privacy: 'public'
            },
            pre: [{
                method: readDatabase,
                assign: 'queryEngine'
            }]
        }
    };

    internals.routes.push(staticRoute);


    // Create 404 route serving files from 'out/' folder instead of 'public_html/'

    if (process.env.NODE_ENV === 'production') {

        internals.out = docpadConfig.outPath || 'out'

        var route404 = {
            method: 'GET',
            path: '/404/{file*}',
            handler: {
                directory: {
                    path: internals.out
                }
            },
            config: {
                cache: {
                    expiresIn: internals.maxAge
                }
            }
        };

        internals.routes.push(route404);

    }

    // Add routes from setings

    if (typeof internals.settings.routes === 'object' &&
        internals.settings.routes.length > 0) {

            internals.routes.push.apply(internals.routes, internals.settings.routes);
    }

    server.route(internals.routes);

    //  If file not found, hit out folder and check if it's there
    if (process.env.NODE_ENV === 'production') {

        server.ext('onPreResponse', function (request, reply) {

            var response = request.response;

            if (!response.isBoom) {

                return reply();
            }

            // Hit 404 route

            var error = response;

            if (request.route.path === '/{file*}' &&
                error.output.statusCode === 404) {

                    var url = '/404/' + request.params.file;
                    //return reply('success').redirect(url);
                    server.inject(url, function (res) {
                        if (!res || !res.result || !res.output || res.output.statusCode === 404) {
                            return reply(res.result);
                        }
                        return reply(res.result);
                    });
            }
            else {
                return reply(error.output.message);
            }

        });
    }

    return server;

};
