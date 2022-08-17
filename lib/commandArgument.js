var yargs = require('yargs');

exports.arguments = {
    hostFileIp: {
        description: 'The IP address to use in the host file population',
        default: '127.0.0.1',
        string: true
    },
    listeningPort: {
        alias: 'p',
        description: 'The port to listen for HTTP requests on',
        required: true,
        default: 8080
    },
    proxyUnknownRequests: {
        alias: 'u',
        description: 'If a matching request is not found in the HAR file, then make on the internet',
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
    },
    useSSL: {
        alias: 's',
        description: 'Enable HTTPS server',
        boolean: true,
        default: false
    },
    listeningSslPort: {
        description: 'The port to listen for HTTP requests on',
        default: 4433
    },
    generateKey: {
        alias: 'g',
        description: 'Generate one time use SSL cert and key, ignored in sslKey or sslCert are set',
        boolean: true,
        default: true
    },
    sslKeyFile: {
        alias: 'k',
        description: 'Name of file containing SSL key to use',
        string: true
    },
    sslCertFile: {
        alias: 'c',
        description: 'Name of file containing SSL cert to use',
        string: true
    },
    dontMatchOnHost: {
        alias: 'd',
        description: 'When matching request against the HAR entry, do not consider the hostname. Especially useful when you cannot run har-server with sudo to modify the hosts file.',
        boolean: true,
        default: false,
    },
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
