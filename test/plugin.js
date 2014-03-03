// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var DocPad = require('docpad');

// Declare internals

var internals = {};

// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('docpad-plugin-hapi', function () {

    var table;
    var config = {};
    var port = 8080;
    var hostname = 'localhost';
    var docpadConfig = {
        outPath: __dirname + '/out',
        srcPath: __dirname + '/src'
    };

    it('loads a docpad instance', function (done) {

        DocPad.createInstance(docpadConfig, function (err, docpad) {
            expect(err).to.not.exist;
            expect(docpad).to.be.an('object');

            done();
        });
    });

    it('provides a valid server for docpad', function (done) {

        DocPad.createInstance(docpadConfig, function (err, docpad) {
            var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

            table = server.table();
            done();
        });
    });

    it('should have a route handler', function (done) {

        DocPad.createInstance(docpadConfig, function (err, docpad) {

            var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

            table = server.table();
            table.filter(function (route) {
                expect(route.settings.handler).to.be.an('function');
            });

            done();
        });
    });

    it('should register a route path', function (done) {

        DocPad.createInstance(docpadConfig, function (err, docpad) {

            var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

            table = server.table();
            table.filter(function (route) {
                expect(route.path).to.equal('/{file*}');
            });

            done();
        });
    });

    it('returns a static asset', function (done) {

        DocPad.createInstance(docpadConfig, function (err, docpad) {

            docpad.action('generate', function(err,result){

                expect(err).to.not.exist;

                var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

                server.inject('/index.html', function (res) {
                    expect(res.statusCode).to.equal(200);
                    done();
                });
            });

        });

    });

    it('returns a 404 if index file not found', function (done) {

        DocPad.createInstance(docpadConfig, function (err, docpad) {

            docpad.action('generate', function(err,result){

                expect(err).to.not.exist;

                var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

                server.inject('/foo/index.html', function (res) {
                    expect(res.statusCode).to.equal(404);
                    done();
                });

            });
        });

    });

    it('should load hapi plugins', function (done) {

        DocPad.createInstance(docpadConfig, function (err, docpad) {

            config = {
                plugins: [{
                    test: {
                        require: __dirname + '/--test1'
                    }
                }]
            };

            var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

            expect(server.plugins).to.have.property('--test1');

            delete config.plugins;

            done();
        });
    });

    it('should catch hapi plugin loading errors and continue', function (done) {

        DocPad.createInstance(docpadConfig, function (err, docpad) {

            config = {
                plugins: [{
                    test: {
                        require: __dirname + '/--test2'
                    }
                }]
            };

            var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

            expect(server.plugins).not.to.have.property('--test2');

            delete config.plugins;

            done();
        });
    });

    it('allows custom hapi server configuration', function (done) {

        config = {
            config: {
                maxSockets: 1001
            }
        };

        DocPad.createInstance(docpadConfig, function (err, docpad) {

            var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

            expect(server).to.have.deep.property('settings.maxSockets', 1001);

            delete config.config;

            done();
        });
    });

    it('allows routes defined in docpad configuration', function (done) {

        config = {
            routes: [{
                path: '/test1',
                method: 'POST',
                handler: function(reply, response) {
                    return reply('test route');
                }
            }]
        };

        DocPad.createInstance(docpadConfig, function (err, docpad) {

            var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

            server.inject('/test1', function (res) {
                expect(res.statusCode).to.equal(200);
                done();
            });

            delete config.routes;

            done();
        });
    });

});