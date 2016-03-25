var harServer = require('../lib/harServer');
var _ = require('lodash');
var fs = require('fs');
var Promise = require('bluebird');
var should = require('should');
var request = require('request');

Promise.promisifyAll(fs);
Promise.promisifyAll(request);

describe('har server core', function () {
    var baseConfig = {
        hostFileIp: '127.0.0.1',
        listeningPort: 8080,
        setHostFileEntries: false,
        removeHostFileEntries: false,
        harFileName: './tests/fixtures/test.har'
    };

    it('should validate good HAR file', function (done) {
        var hs = harServer(baseConfig);
        hs.readHar().then(done).catch(done);
    });

    it('should reject bad HAR file', function (done) {
        var config = _.clone(baseConfig);
        config.harFileName = '../package.json';

        var hs = harServer(config);

        hs.readHar().then(function () {
            done(new Error('Should have failed'));

        }).catch(function () {
            done();

        });
    });

    it('Should update host file', function (done) {
        var config = _.clone(baseConfig);
        config.setHostFileEntries = true;

        var hs = harServer(config);

        hs.readHar().then(function () {
            return hs.setHostFile();

        }).then(function () {
            return fs.readFileSync('/etc/hosts');

        }).then(function (hostFile) {
            hostFile.toString().should.match(/127\.0\.0\.1\s+www.thirdparty.com/);

        }).then(done).catch(done);
    });

    it('Should update host file', function (done) {
        var config = _.clone(baseConfig);
        config.setHostFileEntries = true;
        config.removeHostFileEntries = true;

        var hs = harServer(config);

        hs.readHar().then(function () {
            return hs.setHostFile();

        }).then(function () {
            return hs.cleanHostFile();

        }).then(function () {
            return fs.readFileSync('/etc/hosts');

        }).then(function (hostFile) {
            hostFile.toString().should.not.match(/127\.0\.0\.1\s+www.thirdparty.com/);

        }).then(done).catch(done);
    });

    it('Should start server', function (done) {
        var config = _.clone(baseConfig);
        config.setHostFileEntries = true;
        config.removeHostFileEntries = true;

        var hs = harServer(config);

        hs.readHar().then(function () {
            return hs.setHostFile();

        }).then(function () {
            return hs.start();

        }).then(function () {
            return request.getAsync('http://www.firstparty.com:8080/junk.html');

        }).then(function (res) {
            res.statusCode.should.equal(200);

            return request.getAsync('http://www.firstparty.com:8080/non-existing.html');

        }).then(function (res) {
            res.statusCode.should.equal(404);

            return hs.cleanHostFile();
        }).then(function () {
            done();

        }).catch(function (err) {
            done(err);

        });
    });
});