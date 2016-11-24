var harServer = require('../lib/harServer');
var _ = require('lodash');
var fs = require('fs');
var Promise = require('bluebird');
var should = require('should');
var request = require('request');
var har = require('har');
var harUtil = require('./harUtil');
var http = require('http');


Promise.promisifyAll(fs);
Promise.promisifyAll(request);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

describe('har server core', function () {
    var baseConfig = {
        hostFileIp: '',
        listeningPort: 8080,
        setHostFileEntries: false,
        removeHostFileEntries: false,
        harFileName: './test/fixtures/test.har'
    };
    var proxiedRequester;
    var hs;

    before(function (done) {
        proxiedRequester = Promise.promisifyAll(request.defaults({
            proxy: 'http://localhost:8080/'
        }));

        done();
    });

    afterEach(function (done) {
        var tmpFiles = [];
        Promise.resolve().then(function () {
            if (hs && hs.isRunning()) {
                return hs.stop();
            }
        }).then(done).catch(done);
    });

    after(function (done) {
        harUtil.cleanTempDirectory().then(function () {
            done();
        }).catch(done);
    });

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

    //remove skip when running as root.
    it.skip('Should update host file', function (done) {
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

    //remote skip when running as root
    it.skip('Should clean host file', function (done) {
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

    it('isRunning reports correctly', function (done) {
        var config = _.clone(baseConfig);
        config.setHostFileEntries = true;
        config.removeHostFileEntries = true;

        hs = harServer(config);
        hs.isRunning().should.be.false();

        hs.readHar().then(function () {
            return hs.start();

        }).then(function () {
            hs.isRunning().should.be.true();

            return hs.stop();

        }).then(function () {
            hs.isRunning().should.be.false();

        }).then(done).catch(done);
    });

    it('Should start server', function (done) {
        var config = _.clone(baseConfig);
        config.setHostFileEntries = true;
        config.removeHostFileEntries = true;

        var url = 'http://localhost:8080/page.html';
        var response = 'Everything is cool';
        var har = harUtil.createHar(url, 200, response);

        harUtil.saveHar(har).then(function (file) {
            config.harFileName = file;
            hs = harServer(config);
            return hs.readHar();
        }).then(function () {
            return hs.start();

        }).then(function () {
            return proxiedRequester.getAsync(url);

        }).then(function (res) {
            res.statusCode.should.equal(200);

            return proxiedRequester.getAsync('http://localhost:8080/non-existing.html');

        }).then(function (res) {
            res.statusCode.should.equal(404);

        }).then(done).catch(done);
    });

    it('Should start HTTPS server', function (done) {
        var config = _.clone(baseConfig);
        config.setHostFileEntries = true;
        config.removeHostFileEntries = true;
        config.useSSL = true;
        config.generateKey = true;
        config.listeningSslPort = 8080;

        var url = 'https://localhost:8080/page.html';
        var response = 'Everything is cool';
        var har = harUtil.createHar(url, 200, response);

        harUtil.saveHar(har).then(function (file) {
            config.harFileName = file;
            hs = harServer(config);
            return hs.readHar();

        }).then(function () {
            return hs.start();

        }).then(function () {
            return request.getAsync({
                agentOptions: {
                    rejectUnauthorized: false
                },
                strictSSL: false,
                url: url
            });

        }).then(function (res) {
            res.statusCode.should.equal(200);

            return request.getAsync({
                agentOptions: {
                    rejectUnauthorized: false
                },
                strictSSL: false,
                url: 'https://localhost:8080/404Page.html'
            });
        }).then(function (res) {
            res.statusCode.should.equal(404);

        }).then(done).catch(done);
    });

    it('Should match on request body', function (done) {
        var config = _.clone(baseConfig);
        config.setHostFileEntries = true;
        config.removeHostFileEntries = true;

        var url = 'http://localhost:8080/page.html';
        var urlPost = 'http://localhost:8080/pagePost.html';
        var urlPut = 'http://localhost:8080/pagePut.html';
        var response = 'Everything is cool';
        var goodBody = 'Cool post bro';


        var harFile = harUtil.createHar(url, 200, response);
        harFile.addEntry(
            new har.Entry({
                startedDateTime: new Date(),
                request: new har.Request({
                    url: urlPost,
                    method: 'POST',
                    headers: [],
                    postData: new har.PostData({
                        mimeType: 'text/plain',
                        text: goodBody
                    })
                }),
                response: new har.Response({
                    status: 200,
                    statusText: http.STATUS_CODES[200],
                    headers: [],
                    content: new har.PostData({
                        text: response + 'POST'
                    })
                })
            })
        );

        harFile.addEntry(
            new har.Entry({
                startedDateTime: new Date(),
                request: new har.Request({
                    url: urlPut,
                    method: 'PUT',
                    headers: [],
                    postData: new har.PostData({
                        mimeType: 'text/plain',
                        text: goodBody
                    })
                }),
                response: new har.Response({
                    status: 200,
                    statusText: http.STATUS_CODES[200],
                    headers: [],
                    content: new har.PostData({
                        text: response + 'PUT'
                    })
                })
            })
        );

        harUtil.saveHar(harFile).then(function (file) {
            config.harFileName = file;
            hs = harServer(config);
            return hs.readHar();

        }).then(function () {
            return hs.start();

        }).then(function () {
            return request.postAsync({
                url: urlPost,
                body: goodBody
            });

        }).then(function (res) {
            res.statusCode.should.equal(200);

        }).then(function () {
            return request.putAsync({
                url: urlPut,
                body: goodBody
            });

        }).then(function (res) {
            res.statusCode.should.equal(200);

            return request.postAsync(urlPost, 'Bad Body');

        }).then(function (res) {
            res.statusCode.should.equal(404);

            return request.putAsync(urlPut, 'Bad Body');

        }).then(function (res) {
            res.statusCode.should.equal(404);

            return request.putAsync(urlPost, goodBody);

        }).then(function (res) {
            res.statusCode.should.equal(404);

        }).then(done).catch(done);
    });
});