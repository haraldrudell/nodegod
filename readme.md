# Node God
Launches node applications, restarts them on crash or file updates, produces a shared log.

# Required Configuration
Configured by JSON-files in the filesystem

## Node God itself
* nodegod.js needs to be in the folder
	* $HOME
	* $HOME/apps
	* the folder were Node God's app.js resides

```js
{
	"PORT": 1111,
	"haraldops": {
	},
	"appFiles": "/home/foxyboy/apps/apps.json",
	"sessionSecret": "verygreat"
}
```
* PORT: optional number: the port for Node God, ovverriden by env.PORT, default 3000
* appFiles: required path: where to find json file with app configurations
* sessionSecret: required string, secret for web session
* defaultFolder: a parent folder for deployed apps, default the parent folder of where nodegod's app.js is located

Note: pids are stored at $HOME/tmp or the global temp folder

## Configuring apps

```js
{
	"nodejs3": {
		"state": "run",
		"name": "Node.js #3",
		"watchFiles": [ "package.json", "app.js", "lib", "routes", "/home/foxyboy/apps/nodejs3.json" ]
	}
}
```

* Key: the identifier (computer-friendly string) used for this app, here "nodejs3." This is the name of the default deployment folder for this app
* state: the initial state of the app: run/stop/debug
* folder: optional: the folder where the app is deployed, default as described under nodegod settings
* start: path to the JavaScript launching the app, default app.js
* name: Human readable app name, defaule is Key
* watchFiles: a single entry or array of filenames and folders to watch. If any file changes the app is restarted

# Features
* Web frontend for managing any number of apps
* App lifecycle management with states and transitions for run/stop/debug
* App is automatically restarted unless it crashes in less than 3 seconds
* If app state is crashed, watchers are still active so the app relaunches on update
* File watchers restart the app after a 3 second delay, so that all file writes have time to complete
* Ability to reload app configurations as files are added
* If Node God crashes, it will relaunch managed apps on restart so that they become managed