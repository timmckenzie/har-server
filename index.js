var fs = require('fs');
var Promise = require('bluebird');

Promise.promisifyAll(fs);

var argLib = require('./lib/commandArgument');
var harServer = require('./lib/harServer');

var args;

args = argLib.args();

if (args.help) {
    argLib.printHelp();
    process.exit(0);
}

args.harFileName = args._[0];


var server = harServer(args);
server.run().catch(function (err) {
    console.error('Error ' + err.toString());
    process.exit(1);

});

if (args.removeHostFileEntries) {
    process.on('SIGINT', function () {
        server.cleanHostFile().then(function () {
            process.exit(0);
        });

    });
}