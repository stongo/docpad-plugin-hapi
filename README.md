# [Hapi](http://spumko.github.io/) Server Plugin for [DocPad](http://docpad.org)

A fully customizable Hapi server for docpad.

## Usage (more coming soon)

In docpad.coffee or docpad.js, you can directly add routes as specified in [Hapi Documentation](https://github.com/spumko/hapi/blob/master/docs/Reference.md)
Also, server configuration can be overriden with the 'config' key

```coffee
plugins:
    hapi:
        routes: [
            {
                method: 'POST'
                path: '/api/test'
                handler: (request, reply) ->
                    reply('test')
                config:
                    validate:
                        query: false
            },
            {
                method: 'PUT'
                path: '/api/hello'
                handler: (request, reply) ->
                    reply('hello')
            }
        ],
        config:
            maxSockets: 2000
```

### Deploying to Heroku or other Cloud Hosting

Change Procfile to

```
web: node_modules/docpad-plugin-hapi/bin/docpad-hapi-server
```

## License
Licensed under the incredibly [permissive](http://en.wikipedia.org/wiki/Permissive_free_software_licence) [MIT License](http://creativecommons.org/licenses/MIT/)
