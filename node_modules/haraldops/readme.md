# haraldops
Facilitates configuration, operation and service notifications for node.js applications
# Usage
## Loading a per-machine configuration
```js
var haraldops = require('haraldops')
var defaults = haraldops.init({
	appName: 'Node.js #3',
	path: __dirname,
	logger: console.log })
```
* Derives a filesystem friendly app identifier a-z0-9, in this case 'nodejs3' * Looks for a .json file by this name  in $HOME/apps, $HOME or the folder of this script.
* Loads the json
* does tee if logFile is found
* initializes opsconstructor if pingers or responder is found
* initializes errorstack if found
* determines PORT
* creates RegExps if ignoreUri is found

### using a uniquely named script
```js
haraldops.init({ path: __scriptname, logger: console.log }
```
If the script it called MyStuff.js, identifier is mystuff

### using foldername
```js
haraldops.init({ path: __dirname, logger: console.log }
```
If executing coolfolder/app.js, the identifier is coolfolder

### Using default filename
```js
var haraldops = require('haraldops')
var defaults = loadDefaultFile()
```
* the identifier is used as base filename, default extension is .json
* folders searched are $HOME/apps, $HOME and then any provided folders

### Using an App Name
~/myAppName.json or ./myAppName.json

```js
var haraldops = require('haraldops')
var otherDefaults = load('myAppName', __directory)
```

### Using script filename

```js
var haraldops = require('haraldops')
// in mycode.js: loads from ./mycode.json or ~/mycode.json
var opts = haraldops.defaults(__file + 'on')
```

## Configuration Files
```js
{
	"PORT": 3000,
	"haraldops": {
		"user": "sender@gmail.com",
		"pass": "password",
		"to": "recipient@gmail.com",
		"responder": "/status",
		"identifier": "thisapp",
		"pingers": [
			{
				"title": "Make sure Google is up",
				"url": "http://www.google.com/",
				"isPingerList": false			
			},
			{
				"title": "Another deployment",
				"url": "http://www.example.com/status",
				"app": "monitoredappidentifier"
			}
		]
	},
	"fbAppSecret": "55555",
	"appInterface": "localhost",
	"sessionSecret": "verygreat",
	"ignoreUris": [
		"/status",
		"/favicon.ico",
		"regexp:/images.*",
		"regexp:/stylesheets.*",
		"regexp:/javascripts.*"
	]
}
```

## Manually add monitoring of Google

```js
var haraldops = require('haraldops')
// read deployment defaults from ~/haraldops.json
var ops = haraldops.opsconstructor(console.log)
// monitor google.com every 5 minutes
ops.pinger({ title: "Google",
	url: "http://google.com",
	isPingerList: false})
```

## Allow your app to email you

```js
var haraldops = require('haraldops')
// read deployment defaults from ~/haraldops.json
var mail = haraldops.mailconstructor()
mail.sendMail('subject', 'body')
```

# Reference

## init(opts)
```js
var haraldops = require('haraldops')
var defaults = haraldops.init({
	appName: 'Node.js #3',
	logger: console.log })
```
Loads provisioning json from disk.
* opts
	* .logger: logging function, eg. console.log
	* .path: string or array of strings, eg. __dirname or __filename from calling script
	* .appName: A human readable application name like 'Great Web site'
	* identifier is derived from appname or the last part of the first path provided
	* results: defaults.init.appName, defaults.init.identifier

## ops.mailconstructor(logger, opts)
```js
var haraldops = require('haraldops')
var o = { user: 'sender@gmail.com', pass: 'secret', to: 'me@gmail.com'}
var mailer = haraldops.mailconstructor(console.log, o)
```
Enables your app to email you. Can be invoked via haraldops.init()
* logger: function to use for progress messages, default none
* opts: email settings
	* .user
	* .pass
	* .to recipient address
	* .service default Gmail

## errorstack()
```js
var haraldops = require('haraldops')
haraldops.errorstack()
```
Adds a stack trace to any invocation of console.error or console.warn. Some native modules, eg. http, invokes these functions on difficulties, and having a stack trace enables troubleshooting.
```
This type of response MUST NOT have a body. Ignoring data passed to end().
Error: console.error invocation
    at Error (unknown source)
    at Object.myConsoleError (/home/fasenode/nodejs3/app.js:71:10)
    at ServerResponse.end (http.js:662:13)
    at /home/fasenode/nodejs3/node_modules/express/node_modules/connect/lib/middleware/session.js:281:15
    at Array.0 (/home/fasenode/nodejs3/node_modules/express/node_modules/connect/lib/middleware/session/memory.js:75:11)
    at EventEmitter._tickCallback (node.js:190:38)
```

## logrequest(logger, ignoreTheseUris)
```js
var haraldops = require('haraldops')
var ignoreUris = [
	'/status', '/favicon.ico', /\/images.*/,
	/\/stylesheets.*/, /\/javascripts.*/,
]
app = express.createServer()
app.configure(function(){
	app.use(haraldops.logrequest(console.log, ignoreUris))
...
```
Logs incoming requests. Handles load-balancer forwarding.

* logger: a function that prints a single string argument
* ignoreTheseUris a string, a regexp or an array of those types: do not log these requests

output: Time stamp, request method, host, client and user agent string
```
2012-05-16T23:11Z GET http://localhost:3000/ 127.0.0.1:53169 Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.46 Safari/536.5
```

## opsObject.sendMail(subject, body)
Send mail using the object returned by opsconstructor or mailconstructor.

## opsObject.closeMail()
Closes mail when all pending messages has been sent. Function property of the object returned by opsconstructor or mailconstructor.

## opsconstructor(loggerFunc, opts)
```js
var haraldops = require('haraldops')
var o = {
	user: 'sender@gmail.com', pass: 'secret', to: 'me@gmail.com',
	responder: '/status'
}
var ops = haraldops.opsconstructor(console.log, o)
```
Enables response from other monitoring opsconstructors and monitoring of other opsconstructors. Can be invoked via haraldops.init().
* logger: function to use for progress messages, default none
* opts: settings, keys: user pass to service maxAge pingers
	* maxAge: number of seconds a monitored server can have failed tests
	* pingers: array of argument objects for pinger()
	* responser: string uri for responding to pings
	* identifier: the ap indeitifier for the responding app

## opsObject.responder(app, url)
```js
var haraldops = require('haraldops')
var o = {
	user: 'sender@gmail.com', pass: 'secret', to: 'me@gmail.com',
	responder: '/status'
}
var opsObject = haraldops.opsconstructor(console.log, o)
var app = express.createServer()
opsObject.responder(app, o.responder)
```
* app a server from connect or express
* url a uri where server status is provided, eg. '/status'

## opsObject.pinger(optsArg)
* optsArg
	* title: the printable name of the server being checked eg. 'My box'
	* url: the url for that server, eg. 'http://server.com/status'
	* period (optional, default 300): the number of seconds between each check
	* isPingerList (optional, default yes): if true the entire response is examined for times and consistency. If false, the response has to be error free and have status code 200
	* app the expected app identifier at that url

## opsObject.shutDown()
Deactivates the opsObject

## defaults(appName, defaultFolders, ignoreHome)
* appname, may include folder and extension.
* defaultFolder: single folder or array of folders, no terminating slash
* ignoreHome: do not search in user's home folder

## getOpts(optsArg, defaultOpts, mustHaves, defaultFile)
Parse option argument to a function
* optsArg: provided options
* defaultOpts: merged-in default options
* mustHaves: array of strings, each argument must be present and have string value. If one is missing an exception is thrown
* defaultFile: fully qualified filename used in exception printout

## loadDefaultFile()
Loads ~/haraldops.json and returns the json object

## getHomeFolder()
returns something like '/home/username'

## getTmpFolder()
Returns '/tmp' or '/home/user/tmp' or other suitable folder.

## tee(opts)
```js
haraldops.tee({
	logFile: '/tmp/nodelog,
	logRotate: 'day'
})
```
Copies console.log and console.err output to the named file
* opts:
	* logFolder optional folder, default home folder
	* logFile: filename or complete path eg. '/tmp/nodelog'
	* logRotate: period of rotation minute hour day month year

It's cool! 

## unTee(opts)
