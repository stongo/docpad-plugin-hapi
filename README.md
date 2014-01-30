# [Hapi](http://spumko.github.io/) Server Plugin for [DocPad](http://docpad.org)

A fully customizable Hapi server for docpad.

## Usage (more coming soon)

In docpad.coffee or docpad.js, you can directly add routes as specified in [Hapi Documentation](https://github.com/spumko/hapi/blob/master/docs/Reference.md)

Hapi plugins can easily be loaded. Plugins can access docpad through server.app.docpad. For example, to get docpad configuration, ```server.app.docpad.getConfig()``` or in the router ```request.server.app.docpad.getConfig()```

Also, server configuration can be overriden with the 'config' key

```coffee
# Require Joi for route validation
Joi = require('joi');

# Docpad Configuration Object
module.exports = {
    plugins:
        hapi:
            # router
            routes: [
                {
                    method: 'POST'
                    path: '/test'
                    handler: (request, reply) ->
                        reply('test');
                    config:
                        validate:
                            payload:
                                test: Joi.string().min(3).max(8)
                },
                {
                    method: 'PUT'
                    path: '/hello'
                    handler: (request, reply) ->
                        reply('hello');
                }
            ]
            # server plugins
            plugins: [
                {
                    good:
                        require: 'good',
                        options:
                            subscribers:
                                console: ['request', 'log', 'error']
                },
                {
                    yar:
                        require: 'yar',
                        options:
                            cookieOptions:
                                password: 'password'
                },
                    customPlugin:
                        require: './lib/customPlugin',
                        options:
                            cookieOptions:
                                password: 'password'
            ]
            # server config
            config:
                maxSockets: 2000
```

### Clean URLs

If you want to use cleanurls, you must use https://github.com/stongo/docpad-plugin-cleanurls/tree/staticServer and follow instructions for using a custom static server. A [pull requests](https://github.com/docpad/docpad-plugin-cleanurls/pull/14) exists for this feature in docpad-plugins-cleanurls

### Deploying to Heroku or other Cloud Hosting

Change Procfile to

```
web: node_modules/docpad-plugin-hapi/bin/docpad-hapi-server
```

### Running with pm2 or forever
```
forever start node_modules/docpad-plugin-hapi/out/bin/docpad-hapi-server.js
```

## License
Licensed under the incredibly [permissive](http://en.wikipedia.org/wiki/Permissive_free_software_licence) [MIT License](http://creativecommons.org/licenses/MIT/)
