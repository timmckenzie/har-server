<a name="HarServer"></a>

## HarServer
**Kind**: global class  

* [HarServer](#HarServer)
    * [new HarServer()](#new_HarServer_new)
    * [.run()](#HarServer+run) ⇒ <code>Promise.&lt;TResult&gt;</code>
    * [.readHar(harFileName)](#HarServer+readHar) ⇒ <code>Promise.&lt;TResult&gt;</code>
    * [.setHostFile()](#HarServer+setHostFile) ⇒ <code>Promise.&lt;TResult&gt;</code>
    * [.cleanHostFile()](#HarServer+cleanHostFile) ⇒ <code>Promise.&lt;TResult&gt;</code>
    * [.start(port)](#HarServer+start) ⇒ <code>Promise.&lt;TResult&gt;</code>
    * [.isRunning()](#HarServer+isRunning) ⇒ <code>boolean</code>
    * [.stop()](#HarServer+stop) ⇒ <code>Promise.&lt;TResult&gt;</code>

<a name="new_HarServer_new"></a>

### new HarServer()
Har Server please let jsdoc find this


| Param | Type | Description |
| --- | --- | --- |
| config.harFileName | <code>string</code> | name of HAR file to load.  Relative to current path |
| config.setHostFileEntries | <code>boolean</code> | allows setHostFile() to run |
| config.hostFileIp | <code>string</code> | IP address to match with DNS names in the host file |
| config.removeHostFileEntries | <code>boolean</code> | allows cleanHostFile() to run |
| config.listeningPort | <code>int</code> | the port which the server will listen on |

<a name="HarServer+run"></a>

### harServer.run() ⇒ <code>Promise.&lt;TResult&gt;</code>
Just run the harServer so it works.

**Kind**: instance method of <code>[HarServer](#HarServer)</code>  
**Returns**: <code>Promise.&lt;TResult&gt;</code> - Resolves when the server is running  
<a name="HarServer+readHar"></a>

### harServer.readHar(harFileName) ⇒ <code>Promise.&lt;TResult&gt;</code>
Reads the HAR file and validates it

**Kind**: instance method of <code>[HarServer](#HarServer)</code>  
**Returns**: <code>Promise.&lt;TResult&gt;</code> - Resolved after HAR file has been validated.  

| Param | Type | Description |
| --- | --- | --- |
| harFileName | <code>string</code> | sets config.harFileName before reading HAR file. |

<a name="HarServer+setHostFile"></a>

### harServer.setHostFile() ⇒ <code>Promise.&lt;TResult&gt;</code>
Adds entries to host file.  Must be run after calling readHar

**Kind**: instance method of <code>[HarServer](#HarServer)</code>  
**Returns**: <code>Promise.&lt;TResult&gt;</code> - Resolved after host file has been updated  
<a name="HarServer+cleanHostFile"></a>

### harServer.cleanHostFile() ⇒ <code>Promise.&lt;TResult&gt;</code>
Removes any host files entries that have been added.  Must be run after setHostFile

**Kind**: instance method of <code>[HarServer](#HarServer)</code>  
**Returns**: <code>Promise.&lt;TResult&gt;</code> - Resolved after host file has been updated  
<a name="HarServer+start"></a>

### harServer.start(port) ⇒ <code>Promise.&lt;TResult&gt;</code>
Creates server.  Must be run after readHar

**Kind**: instance method of <code>[HarServer](#HarServer)</code>  
**Returns**: <code>Promise.&lt;TResult&gt;</code> - Resolved after server is listening  

| Param | Type | Description |
| --- | --- | --- |
| port | <code>int</code> | Sets the listening port |

<a name="HarServer+isRunning"></a>

### harServer.isRunning() ⇒ <code>boolean</code>
Returns true if the server is running; otherwise false

**Kind**: instance method of <code>[HarServer](#HarServer)</code>  
<a name="HarServer+stop"></a>

### harServer.stop() ⇒ <code>Promise.&lt;TResult&gt;</code>
Stops the server.  If the server is not running,

**Kind**: instance method of <code>[HarServer](#HarServer)</code>  
**Returns**: <code>Promise.&lt;TResult&gt;</code> - Resolves after server has stopped.  
