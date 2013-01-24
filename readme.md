# Node God

Node God manages node applications, restarts them on crash and produces a shared log.

![alt Nodegod Screen Shot](https://raw.github.com/haraldrudell/nodegod/master/test/images/nodegod.png)

# Benefits

1. **Monitor** a handful of apps on a handful of servers as you work on them
2. **Immediate glance**: the top bar goes red if any app is in crash state or the connection is lost
3. **Focus** on your current app by scrolling it into view
4. **No command line.** Ever.

# Features

1. Launch and **lifecycle management** of any number of apps
2. **Browser interface** supporting remote machines over ssh tunnel
3. Websocket communication for **real-time** updates
4. Command queue and application state and transitions for **run/stop/debug**.
5. **Restarts** apps automatically until crash within 3 seconds.
6. If app state is crashed, **file watchers** are still active so that a relaunch attempt is made on file update.
7. File watchers restart the app after a 1 second idle time, so that all file writes have time to complete.
8. Ability to reload app configurations as apps are added.
9. If Node God crashes, it will relaunch managed apps on restart so that they again become managed.
10. USRSIG2 signal for **graceful shutdown**, implemented by [App Runner](https://github.com/haraldrudell/apprunner)
11. Aggregation of stdout from many apps to a **common log**.
12. Fetch of port and url from the app so **direct link** can be displayed in the ui.

# Run as demo

```js
nodegod$ node app


=== 2012-06-23 13:24:21 Node God starting
   info  - socket.io started
process /home/foxyboy/Desktop/c505/node/nodegod/apps.json
Application Node God on node v0.6.14 available on port 1111 in development mode
127.0.0.1
```

opens a browser window that monitors an app that exits every 10 seconds.

# Configuration Files

## nodegod.json
Node God itself is configured using a json file that provides port number, a session secret and the location of other json files containing application configurations. The paths searched for nodegod.json are:
* $HOME/apps
* $HOME
* Node God's launch folder, where app.js is located

```js
{
	"appFiles": "/home/foxyboy/apps/apps.json",
}
```
* PORT: optional number: the port for Node God, defaults to env.PORT or 1111
* appFiles: optional string or array of strings: filenames to search for app configurations.
	* if strings are not fully qualified paths, the folder where  nodegod.json was found or node god's app folder are searched
	* default: apps.json in either the noegod.json folder or nodegod's app folder
* sessionSecret: optional string, has a default value
* defaultFolder: a parent folder for deployed apps, default the parent folder of where nodegod's app.js is located

Note: pids are stored in a file at $HOME/tmp or the global temp folder

## Configuring files for monitored apps

```js
{
	"Node.js #3": {
		"watchFiles": [
			"package.json",
			"app.js",
			"lib",
			"routes",
			"/home/foxyboy/apps/nodejs3.json"
		]
	}
}
```

* Key: the name of this app
* id: optional string: the identifier (computer-friendly string) used for this app. default is derived from the app name, for "Node.js #3" here it would be "nodejs3"
* state: optional string: the initial state of the app: run/stop/debug, default run
* folder: optional path: the folder where the app is deployed. Default is a sibling folder to nodegod, ie. the parent folder of nodegod with id appended.
* start: optional string or array of strings: parameters to the node executable, default app.js in the app's folder
* watchFiles: optional string or array of Strings: filenames and folders to watch. If any file changes the app is restarted
* launchBrowser: optional string: url for which a browser window is launched once

# Notes

(c) [Harald Rudell](http://www.haraldrudell.com) wrote this for node in June, 2012

No warranty expressed or implied. Use at your own risk.

Please suggest better ways, new features, and possible difficulties on [github](https://github.com/haraldrudell/nodegod)