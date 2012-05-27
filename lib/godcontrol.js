// nodereq.js
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
	switch(data.type) {
	case 'getApps':
		result = { type: 'apps', apps: godmodel.getApps() }
		break
	case 'run':
		var app = godmodel.getApp(data.app)
		if (app && app[data.type]()) {
			result = { type: 'ok' }
		}
	}
	return result
}

// an update from the model
function appEvent(app) {
	sendToClient({ type: app, app: app})
}

function init(app, defaults, dirname) {
	sendToClient = godsocket.init(app, clientToControl)
	godmodel.loadAppFiles(defaults, dirname)
	appentity.eventListener(appEvent)
}