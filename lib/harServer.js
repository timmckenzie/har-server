var Promise = require('bluebird');
var fs = require('fs');
var http = require('http');
var harValidator = require('har-validator');
var isRoot = require('is-root');
var _ = require('lodash');
var urlLib = require('url');
var isIp = require('net').isIP;
var hostile = require('hostile');
Promise.promisifyAll(hostile);
Promise.promisifyAll(fs);

/**
 * Har Server please let jsdoc find this
 * @constructor
 * @param config.harFileName {string} name of HAR file to load.  Relative to current path
 * @param config.setHostFileEntries {boolean} allows setHostFile() to run
 * @param config.hostFileIp {string} IP address to match with DNS names in the host file
 * @param config.removeHostFileEntries {boolean} allows cleanHostFile() to run
 * @param config.listeningPort {int} the port which the server will listen on
 * @returns {HarServer}
 */
function HarServer(config) {

    var self = this;

    self.config = config || {};
    var server;
    var har;
    var hostFileObject = [];

    var hostFileLocation = process.platform === 'win32'
        ? 'C:/Windows/System32/drivers/etc/hosts'
        : '/etc/hosts';


    /**
     * Just run the harServer so it works.
     * @returns {Promise.<TResult>} Resolves when the server is running
     */
    this.run = function run() {
        return self.readHar().then(function () {
            if (self.config.setHostFileEntries) {
                return setHostFile();
            }
        }).then(function () {
            self.start();
        });
    };

    /**
     * Reads the HAR file and validates it
     * @param harFileName {string} sets config.harFileName before reading HAR file.
     * @returns {Promise.<TResult>} Resolved after HAR file has been validated.
     */
    this.readHar = function readHar(harFileName) {
        if (!_.isEmpty(harFileName) && _.isString(harFileName)) {
            self.config.harFileName = harFileName
        }

        return fs.accessAsync(self.config.harFileName, fs.R_OK).catch(function (err) {
            throw new Error('Cannot read har file at ' + self.config.harFileName);

        }).then(function () {
            return fs.readFileAsync(self.config.harFileName);

        }).then(function (harRawData) {
            har = JSON.parse(harRawData);
            return harValidator.validator(har);

        }).then(function () {
            return Promise.resolve();

        });
    };

    /**
     * Adds entries to host file.  Must be run after calling readHar
     * @returns {Promise.<TResult>} Resolved after host file has been updated
     */
    this.setHostFile = function setHostFile() {
        if (!self.config.setHostFileEntries) {
            console.log('setHostFile called, but updateHostFile flag not set.  Not going to update host file');
            return Promise.resolve();
        }

        if (!har) {
            throw new Error('Must call readHar before setHostFile');
        }

        if (!_.isEmpty(hostFileObject)) {
            throw new Error('Must clear pre-existing host file before setting more');

        }

        return fs.accessAsync(hostFileLocation, fs.W_OK).catch(function (err) {
            throw new Error('Cannot access host file at ' + hostFileLocation);

        }).then(function () {

            var setHostPromises = [];
            var existingEntries = {};
            //preprocess all domians, and generate a host file.
            for (var i = 0; i < har.log.entries.length; i++) {
                var curEntry = har.log.entries[i];
                curEntry.parsedUrl = urlLib.parse(curEntry.request.url);

                if (hostFileObject[curEntry.parsedUrl.hostname]) {
                    continue;
                }

                if (isIp(curEntry.parsedUrl.hostname) !== 0) {
                    continue;
                }

                if (existingEntries[curEntry.parsedUrl.hostname]) {
                    continue;
                }

                existingEntries[curEntry.parsedUrl.hostname] = true;

                hostFileObject.push({name: curEntry.parsedUrl.hostname, ip: self.config.hostFileIp});
            }

            console.log('Setting host file');
            return Promise.map(hostFileObject, function (curHost) {
                console.log('Adding: ' + curHost.ip + '  ' + curHost.name);
                return hostile.setAsync(curHost.ip, curHost.name);

            }, {concurrency: 1});
        });
    };

    /**
     * Removes any host files entries that have been added.  Must be run after setHostFile
     * @returns {Promise.<TResult>} Resolved after host file has been updated
     */
    this.cleanHostFile = function cleanHostFile() {
        if (!self.config.removeHostFileEntries) {
            console.log('cleanHostFile called, but cleanHostFile flag not set.  Not going to clean host file');
            return Promise.resolve();
        }

        if (!har) {
            throw new Error('Must call readHar before setHostFile');
        }

        if (_.isEmpty(hostFileObject)) {
            throw new Error('Must clear pre-existing host file before setting more');

        }

        return fs.accessAsync(hostFileLocation, fs.W_OK).catch(function (err) {
            throw new Error('Cannot access host file at ' + hostFileLocation);

        }).then(function () {
            console.log('Cleaning host file');
            return Promise.map(hostFileObject, function (curHost) {
                console.log('Removing ' + curHost.ip + '  ' + curHost.name);
                return hostile.removeAsync(curHost.ip, curHost.name);

            }, {concurrency: 1});
        });
    };

    /**
     * Creates server.  Must be run after readHar
     * @param port {int} Sets the listening port
     * @returns {Promise.<TResult>} Resolved after server is listening
     */
    this.start = function start(port) {
        if (server) {
            throw new Error('Server is already running');
        }

        if (_.isNumber(part) && port > 0 && port <= 65535) {
            self.config.listeningPort = port;
        }

        if (!isRoot() && self.config.listeningPort <= 1024) {
            throw new Error('Cannot bind to ports less then 1024 without being root');
        }

        var hostFileObject = {};

        return Promise.resolve().then(function () {
            server = http.createServer(function (req, res) {

                var host = req.headers.host || '';
                var harEntry = _.find(har.log.entries, function (entry) {
                    entry.parsedUrl = urlLib.parse(entry.request.url);

                    if (req.method === entry.request.method
                        && req.url === entry.parsedUrl.path
                        && host === entry.parsedUrl.host) {
                        return entry;
                    }
                });

                if (harEntry === undefined) {
                    res.statusCode = 404;
                    console.error(req.method + ' (' + res.statusCode + ') ' + host + ' ' + req.url + ' (Not in HAR file)');
                    res.end('Cannot find HAR file entry for a ' + req.method + ' to ' + req.url);
                    return;
                }

                if (!harEntry.response.content.text && harEntry.response.content.size > 0) {
                    res.statusCode = 404;
                    console.error(req.method + ' (' + res.statusCode + ') ' + host + ' ' + req.url + ' (No response body in HAR file.)');
                    res.end('No response body in HAR file a ' + req.method + ' request to ' + req.url);
                    return;
                }

                res.statusCode = harEntry.response.status;
                for (var i = 0; i < harEntry.response.headers.length; i++) {
                    var curHeader = harEntry.response.headers[i];

                    var lowerCaseHeader = curHeader.name.toLowerCase();
                    if (lowerCaseHeader === 'content-encoding') {
                        continue;
                    }

                    if (lowerCaseHeader === 'content-length') {
                        continue;
                    }

                    res.setHeader(curHeader.name, curHeader.value);
                }

                console.log(req.method + ' (' + harEntry.response.status + ') ' + host + ' ' + req.url);

                if (harEntry.response.content.encoding === 'base64') {
                    return res.end(new Buffer(harEntry.response.content.text, 'base64'));
                }

                res.end(harEntry.response.content.text);

            });

            console.log('listening on ' + self.config.listeningPort);
            server.listen(self.config.listeningPort);
        });
    };

    /**
     * Returns true if the server is running; otherwise false
     * @returns {boolean}
     */
    this.isRunning = function isRunning() {
        return typeof server !== 'undefined';
    };

    /**
     * Stops the server.  If the server is not running,
     * @returns {Promise.<TResult>} Resolves after server has stopped.
     */
    this.stop = function stop() {
        if (!server) {
            return Promise.resolve();
        }

        return Promise.asCallback(server.bind(null, 'close'));
    };

    return self;
};

module.exports = HarServer;