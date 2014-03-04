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

            var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

            table = server.table();

            it('should have a route handler', function (done) {

                    table.filter(function (route) {
                        expect(route.settings.handler).to.be.an('function');
                    });

                    done();
            });

            it('should register a route path', function (done) {

                    table.filter(function (route) {
                        expect(route.path).to.equal('/{file*}');
                    });

                    done();
            });

            done();
    });

    it('returns a static asset', function (done) {

        docpad.action('generate', function(err,result){

            expect(err).to.not.exist;

            var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

            server.inject('/index.html', function (res) {
                expect(res.statusCode).to.equal(200);
                done();
            });
        });

    });

    it('returns a 404 if index file not found', function (done) {

            var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

            server.inject('/foo/index.html', function (res) {
                expect(res.statusCode).to.equal(404);
                done();
            });

    });

    it('returns a 304 if etag matches', function (done) {

            var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

            server.inject('/index.html', function (res1) {
                expect(res1.statusCode).to.equal(200);
                expect(res1.headers.etag).to.exist;

                var etag1 = res1.headers.etag;

                expect(etag1.slice(0, 1)).to.equal('"');
                expect(etag1.slice(-1)).to.equal('"');

                server.inject({ url: '/index.html', headers: { 'if-none-match': etag1 } }, function (res2) {

                    expect(res2.statusCode).to.equal(304);
                    expect(res2.headers).to.not.have.property('content-length');
                    expect(res2.headers).to.not.have.property('etag');
                    expect(res2.headers).to.not.have.property('last-modified');

                    done();
                });
            });

    });

    it('returns a 304 when the request has if-modified-since and the response hasn\'t been modified since', function (done) {

            var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

            server.inject('/index.html', function (res1) {

                server.inject({ url: '/index.html', headers: { 'if-modified-since': res1.headers.date } }, function (res2) {

                    expect(res2.statusCode).to.equal(304);
                    expect(res2.headers).to.not.have.property('content-length');
                    expect(res2.headers).to.not.have.property('etag');
                    expect(res2.headers).to.not.have.property('last-modified');
                    done();
                });
            });

    });

    it('does not try to serve an empty file from in-memory database', function (done) {

        var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

        server.inject('/empty.html', function (res) {
            expect(res.statusCode).to.equal(200);
            done();
        });

    });

    it('supports clean urls', function (done) {

        var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

        server.inject('/test', function (res) {
            expect(res.statusCode).to.equal(200);
            done();
        });

    });

    it('can set a different extension as default for clean urls', function (done) {

        config = {
            defaultExtension: 'txt'
        };

        var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

        server.inject('/clean', function (res) {
            expect(res.statusCode).to.equal(200);
            done();
        });

    });

    it('should load hapi plugins', function (done) {

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

    it('should catch hapi plugin loading errors and continue', function (done) {

        config = {
            plugins: [{
                test: {
                    require: __dirname + '/--test'
                }
            }]
        };

        var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

        expect(server.plugins).not.to.have.property('--test');

        delete config.plugins;

        done();
    });

    it('should catch hapi plugin exceptions and continue', function (done) {

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

    it('allows custom hapi server configuration', function (done) {

        config = {
            config: {
                maxSockets: 1001
            }
        };

        var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

        expect(server).to.have.deep.property('settings.maxSockets', 1001);

        delete config.config;

        done();
    });

    it('allows routes defined in docpad configuration', function (done) {

        config = {
            routes: [{
                path: '/test1',
                method: 'GET',
                handler: function(reply, response) {
                    return reply('test route');
                }
            }]
        };


        var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

        server.inject('/test1', function (res) {
            expect(res.statusCode).to.equal(200);
            done();
        });

        delete config.routes;

        done();
    });

});