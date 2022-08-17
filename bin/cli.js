#!/usr/bin/env node

var fs = require('fs');
var Promise = require('bluebird');
var _ = require('lodash');
Promise.promisifyAll(fs);

var argLib = require('../lib/commandArgument');
var harServer = require('../lib/harServer');

var args;

args = argLib.args();

if (args.help) {
    argLib.printHelp();
    process.exit(0);
}

args.harFileName = args._[0];

var server = harServer(_.clone(args));
var plainTextServer;
Promise.resolve().then(function () {
    return server.readHar();

}).then(function () {
    if (args.setHostFileEntries) {
        return server.setHostFile();
    }

}).then(function () {
    return server.start({port: args.useSSL ? args.listeningSslPort : args.listeningPort});

}).then(function () {
    if (args.useSSL === false) {
        return;
    }
    //this might seem weird, harServer will only use ssl if useSSL is set,
    //so, if we unset it and run harServer again, then run in plain text.

    var plainTextConfig = _.clone(args);
    plainTextConfig.useSSL = false;

    plainTextServer = harServer(plainTextConfig);

    return plainTextServer.readHar().then(function () {
        return plainTextServer.start({port: args.listeningPort});
    });

}).catch(function (err) {
    console.error(err.toString());
    process.exit(1);

});

if (args.removeHostFileEntries) {
    process.on('SIGINT', function () {
        server.cleanHostFile().then(function () {
            process.exit(0);
        });

    });
}
