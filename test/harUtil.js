var fs = require('fs');
var pathLib = require('path');
var tmp = require('tmp');
var HAR = require('har');
var http = require('http');
var Promise = require('bluebird');
var package = require('../package.json');
var _ = require('lodash');

Promise.promisifyAll(fs);
const TempDir = './test/tmp';

tmp.setGracefulCleanup();

module.exports = {
    saveHar: function saveHar(har) {
        var fileName = tmp.tmpNameSync({dir: pathLib.resolve(TempDir)});

        return fs.writeFileAsync(fileName, JSON.stringify({log: har})).then(function () {
            return Promise.resolve(fileName);
        });
    },
    createEmptyHar: function createEmptyHar() {
        var creator = new HAR.Creator({
            name: package.name + ' test',
            version: package.version
        });
        var browser = new HAR.Browser({
            name: package.name + ' browser',
            version: package.version
        });

        return new HAR.Log({
            creator: creator,
            browser: browser,
            version: 1.2,
            comment: 'TempHar for Har-Server'
        });
    },
    createHar: function createHar(url, responseCode, responseBody) {
        var har = this.createEmptyHar();

        return har.addEntry({
            startedDateTime: new Date(),
            request: new HAR.Request({
                url: url,
                method: 'GET',
                headers: []
            }),
            response: new HAR.Response({
                status: responseCode,
                statusText: http.STATUS_CODES[responseCode],
                headers: [],
                content: new HAR.PostData({
                    text: responseBody
                })
            })
        });
    },
    cleanTempDirectory: function cleanTempDirectory() {
        var absoluteTempDir = pathLib.resolve(TempDir);
        return fs.readdirAsync(absoluteTempDir).then(function (fileNames) {
            var deletePromises = [];
            for (var i = 0; i < fileNames.length; i++) {
                if (_.startsWith(fileNames[i], 'tmp')) {
                    deletePromises.push(fs.unlinkAsync(absoluteTempDir + pathLib.sep + fileNames[i]));
                }
            }
            return Promise.all(deletePromises);
        });
    }
};