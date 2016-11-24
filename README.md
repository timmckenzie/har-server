#HAR Server
#####Serve files from a HAR file.
har-server takes a HAR file as an input, and creates a HTTP server which will replay responses from the HAR file.

###Install Command
```bash
npm install -g har-server
```

###How does it work?
1. Capture a HAR file with full response bodies.  Lets use http://cnn.com, and save HAR as cnn.com.har
2. Run har-server `sudo har-server cnn.com.har -p 80 -h -r`
 * -p will set the listening port to 80.  You need to run as root to do this
 * -h add all domains in HAR to host file, and point them to 127.0.0.1
 * -r remove all domains which were added to host file, when SIGINT is caught (ctrl+c).
3. Open your browser, and open http://cnn.com
 * DNS cache might keep requests from cnn.com from coming form har-server
4. All responses will be a reply from cnn.har.

###Serving a resource
A request for a resource is considered to be a match of a HAR file entry if and only if:
* the HAR host matches the requests host header
* the HAR path, query string, and fragment exactly matches the request path, query string, and fragment
* the HAR HTTP method matches the request HTTP method
* the request body, and HAR request body match
If the HAR file contains multiple matches for a specific request the first match is used in the response.

###Serving a HTTPS har
har-server can generate its own SSL key and certificate, or use pre-existing ones.  However, loading the har file in a browser
causes all sorts of SSL errors.  har-server uses one key-cert pair for every domain, which causes all browsers display
a warning on the page's domain, and reject all 3rd party resources.  This is good for security but bad for serving HAR files.

Chrome has a command line switch to disable this check.  Here are some common install locations with the switch added.
```bash
#OSX
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --ignore-certificate-errors

#Ubuntu
/opt/google/chrome/google-chrome --ignore-certificate-errors

#Windows 7 and newer
C:\Users\%USERNAME%\AppData\Local\Google\Chrome\Application\chrome.exe --ignore-certificate-errors
```

###Running har-server
```bash
har-server [OPTIONS] <file.har>
```

####Options
#####--hostFileIp
The IP address to associate with DNS name in the host file.  Default 127.0.0.1

#####--listeningPort, -p
The port which har-server will listen on.  If below 1024 har-server must be run as root.  Default 8080

#####--setHostFileEntries, -h
Add host entries to host file.  Host file location on Linux and OSX is assumed to be /etc/hosts, on Windows C:/Windows/System32/drivers/etc/hosts.
If this setHostFileEntries is used and host file is not writable, then har-server will not run.  Default false

#####--removeHostFileEntries, -r
When har-server receives SIGINT (ctrl+c) remove host file entries in HAR file.  Must be used with setHostFileEntries.
Host file location on Linux and OSX is assumed to be /etc/hosts, on Windows C:/Windows/System32/drivers/etc/hosts. If
this setHostFileEntries is used and host file is not writable, then har-server will not run.  Default false

#####--useSSL, -s
Enable HTTPS server.  Default false

#####--listeningSslPort
The port to listen for HTTPS requests on.  Default 4433

#####--generateKey, -g
Generate one time use SSL cert and key.  This switch is ignored if sslKeyFile or sslCertFile are set.  Default true

#####--sslKeyFile, -k
Name of file containing SSL key to use.  Must also have sslCertFile set.  No default

#####--sslCertFile, -c
Name of file containing SSL cert to use.  Must also have sslKeyFile set.  No default


###Future plans
* Option to compare header values before when finding response in HAR file.
* Option to have conditional query string values when finding response in HAR file.
* Reverse proxy requests which are not in the HAR.  har-server would have to pre-fetch DNS records before modifying the host
file.  When a request comes in, request from the IP address and set the host header.
* HTTP2 support.
* Add option to use http proxy instead of editing host file, to redirect requests to har-server.  This would also deal with IP based requests.
* Option to not match on port
