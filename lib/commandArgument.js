var yargs = require('yargs');

exports.arguments = {
    hostFileIp: {
        description: 'The IP address to use in the host file population',
        default: '127.0.0.1',
        string: true
    },
    listeningPort: {
        alias: 'p',
        description: 'The port to listen on',
        required: true,
        default: 8080
    },
    proxyUnknownRequests: {
        alias: 'u',
        description: 'If a matching request is not found in the HAR file, then make on the internet',
        required: true,
        default: false
    },
    silent: {
        alias: 's',
        description: 'Suppress all console messages',
        required: true,
        default: false
    },
    checkHeader: {
        description: 'Check that specified header matches HAR file entry before responding.  NOT IMPLEMENTED'
    },
    checkQuery: {
        description: 'Check all entire query string against HAR file entry.  NOT IMPLEMENTED',
        default: true,
        boolean: true
    },
    setHostFileEntries: {
        alias: 'h',
        description: 'Add host file entries',
        boolean: true,
        default: false
    },
    removeHostFileEntries: {
        alias: 'r',
        description: 'Removes host files entires added by har-server',
        boolean: true,
        default: false
    }
};

exports.usage = '$0 [OPTIONS] <file.har>\n\n' +
    'HAR server takes a HAR file, and creates a HTTP server which will respond with resources and files in the HAR.\n' +
    'This will totally fail if the HAR file does not contain response bodies.';

exports.args = function args() {
    return yargs.argv;
};

exports.printHelp = function printHelp() {
    console.log(yargs.help());
};

yargs.options(exports.arguments)
    .usage(exports.usage)
    .wrap(yargs.terminalWidth())
    .demand(1, 1, 'HAR file name is required')
    .help('help');