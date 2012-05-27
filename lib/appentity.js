// appentity.js

// http://nodejs.org/api/child_process.html
var child_process = require('child_process')

module.exports = {
	AppEntity: AppEntity,
	eventListener: eventListener,
}

//
var listener = function () {}

// app.state can be 'debug' 'run' 'stop' or undefined (not running)
// app.name is human readable string 'Node.js #3'
// app.id is identifier 'nodejs3'

// internal
// app.child
// app.inState indicates confirmed state
// start how to start the app

function AppEntity(o) {
	var child
	var start = o.start
	var inState
	var watchFiles = o.watchFiles
	var watchers
	this.state = o.state
	this.name = o.name
	this.id = o.id
	// TODO update inState to state

	this.update = function (o) {
		this.state = o.state
		if (o.name) this.name = o.name
		if (o.start) start = o.start
		if (o.watchFiles.length) watchFiles = o.watchFiles
		// TODO update watchers
	// TODO update inState to state
	}

	this.isDebug = function() {
		return app.inState == 'debug'
	}

	// move app to start state
	this.run = function () {
		var result
		this.state = 'run'
		if (inState != 'run') {
			var args = start.split(' ')
			child = child_process.spawn('node', args)
			child.stdout.on('data', function (data) {
				// data is Buffer
				console.log(this.id, data.toString())
			})
			child.stderr.on('data', function (data) {
				// data is Buffer
				console.log(this.id, data.toString())
			})
			child.on('exit', function (code) {
				// code is number
				console.log(this.id + ' exit:', code)
			})
			child.stderr.setEncoding('utf8')
			child.stdout.setEncoding('utf8')
			inState = 'run'
			listener(this)
		}
		result = true
	}

}

function eventListener(func) {
	listener = func
}