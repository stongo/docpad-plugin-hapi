// Load modules

var Lab = require('lab');
var Hapi = require('hapi');

// Declare internals

var internals = {};

// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


require('docpad').createInstance({}, function (err, docpadInstance) {
    expect(err).to.not.exist;
    console.log('docpad loaded');
});

describe('docpad-plugin-hapi', function () {
    // Create instance of Docpad

    var table;
    var config = {};
    var port = 8080;
    var hostname = 'localhost';

    it('provides a valid server for docpad', function (done) {

        var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

        table = server.table();
        done();
    });

    it('should have a route handler', function (done) {

        var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

        table = server.table();
        table.filter(function (route) {
            expect(route.settings.handler).to.be.an('function');
        });

        done();
    });

    it('returns a static asset', function(done) {

        var server = require('../lib/hapi.server.js')(docpad, config, port, hostname);

        server.inject('/index.html', function(res) {
            expect(res.statusCode).to.equal(404);
            done();
        });

    });

    it('returns a 404 if index file not found', function(done) {

        var server = new Hapi.Server({ files: { relativeTo: process.cwd() } });

        server.inject('/index.html', function(res) {
            expect(res.statusCode).to.equal(404);
            done();
        });

    });
    
});