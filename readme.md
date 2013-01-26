<!doctype html>
<title>Node God</title>


<h1>Node God</h1>
<p>Node God manages node applications, restarts them on crash and produces a shared log.</p>
<img src=https://raw.github.com/haraldrudell/nodegod/master/test/images/nodegod.png alt="Nodegod Screen Shot" />
<p>&copy; <strong><a href=http://www.haraldrudell.com>Harald Rudell</a></strong> wrote Node God for node in May, 2012. MIT License</p>
<h1>Benefits</h1>
<ol>
<li><strong>Monitor</strong> a handful of apps on a handful of servers as you work on them</li>
<li><strong>Immediate glance</strong>: the top bar goes red if any app is in crash state or the connection is lost</li>
<li><strong>Focus</strong> on your current app by scrolling it into view
<li><strong>No command line.</strong> Ever.</li>
</ol>
<h1>Features</h1>
<ol>
<li>Launch and **lifecycle management** of any number of apps</li>
<li><strong>Browser interface</strong> supporting remote machines over ssh tunnel</li>
<li>Websocket communication for <strong>real-time</strong> updates</li>
<li>Command queue and application state and transitions for <strong>run/stop/debug</strong>.</li>
<li><strong>Restarts</strong> apps automatically until crash within 3 seconds.</li>
<li>If app state is crashed, <strong>file watchers</strong> are still active so that a relaunch attempt is made on file update.</li>
<li>File watchers restart the app after a 1 second idle time, so that all file writes have time to complete.</li>
<li>Ability to reload app configurations as apps are added.</li>
<li>If Node God crashes, it will relaunch managed apps on restart so that they again become managed.</li>
<li>USRSIG2 signal for <strong>graceful shutdown</strong>, implemented by <a href=https://github.com/haraldrudell/apprunner>App Runner</a></li>
<li>Aggregation of stdout from many apps to a <strong>common log</strong>.</li>
<li>Fetch of port and url from the app so <strong>direct link</strong> can be displayed in the ui.</li>
</ol>
<p><strong>Node God</strong> is robustly written as four detached processes carefully designed to stay running indefinitely. These processes will stay running until you power of your machine.</p>


<h1>Run as demo</h1>
```js
nodegod$ node app


=== 2012-06-23 13:24:21 Node God starting
   info  - socket.io started
process /home/foxyboy/Desktop/c505/node/nodegod/apps.json
Application Node God on node v0.6.14 available on port 1111 in development mode
127.0.0.1
```

<p>opens a browser window that monitors an app that exits every 10 seconds.</p>


<h1>Configuration Files</h1>


<h2>nodegod.json</h2>
<p>Node God itself is configured using a json file that provides port number, a session secret and the location of other json files containing application configurations. The paths searched for nodegod.json are:</p>
<ul>
<li>$HOME/apps</li>
<li>$HOME</li>
<li>Node God's launch folder, where app.js is located</li>
</ul>
```js
{
	"appFiles": "/home/foxyboy/apps/apps.json",
}
```
<ul>
<li>PORT: optional number: the port for Node God, defaults to env.PORT or 1111</li>
<li>appFiles: optional string or array of strings: filenames to search for app configurations.<ul>
	<li>if strings are not fully qualified paths, the folder where  nodegod.json was found or node god's app folder are searched</li>
	<li>default: apps.json in either the noegod.json folder or nodegod's app folder</li></ul></li>
<li>sessionSecret: optional string, has a default value</li>
<li>defaultFolder: a parent folder for deployed apps, default the parent folder of where nodegod's app.js is located</li>
</ul>
<p>Note: pids are stored in a file at $HOME/tmp or the global temp folder</p>


<h2>Configuring files for monitored apps</h2>
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
<ul>
<li>Key: the name of this app</li>
<li>id: optional string: the identifier (computer-friendly string) used for this app. default is derived from the app name, for "Node.js #3" here it would be "nodejs3"<li>
<li>state: optional string: the initial state of the app: run/stop/debug, default run<li>
<li>folder: optional path: the folder where the app is deployed. Default is a sibling folder to nodegod, ie. the parent folder of nodegod with id appended.<li>
<li>start: optional string or array of strings: parameters to the node executable, default app.js in the app's folder<li>
<li>watchFiles: optional string or array of Strings: filenames and folders to watch. If any file changes the app is restarted<li>
<li>launchBrowser: optional string: url for which a browser window is launched once<li>
</ul>
<p>&copy; <strong><a href=http://www.haraldrudell.com>Harald Rudell</a></strong> wrote Node God for node in May, 2012. MIT License</p>
</html>
