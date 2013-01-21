// godcontrol.js
// Controller for Node God
// © Harald Rudell 2011 MIT License

var godmodel = require('./godmodel')
var appentity = require('./appentity')
var godsocket = require('./godsocket')

module.exports = {
	init: init,
}

var sendToClient = function () {}

// a request from the socket
function clientToControl(data, result) {
	var result
	var type = data.type
	switch(type) {
	case 'getApps':
		result = { type: 'apps', apps: godmodel.getApps() }
		break
	case 'reload':
		godmodel.reloadAppFiles()
		result = false
		break
	case 'nodebug':
		type = 'run'
	case 'run':
	case 'stop':
	case 'debug':
	case 'restart':
		var app = godmodel.getApp(data.app)
		if (app) {
			// true/false
			var outcome = app.doCommand(type)
			if (outcome) result = false // no response
			else result = undefined // error
		}
	}
	return result
}

// an update from the model
function appEvent(app, isCrash) {
	var data = {type:'app', app:app}
	if (isCrash) data.crash = true
	sendToClient(data)
}

function init(app, defaults) {
	sendToClient = godsocket.init(app, clientToControl)
	godmodel.loadAppFiles(defaults)
	appentity.eventListener(appEvent)
}