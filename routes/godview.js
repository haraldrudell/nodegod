// index.js
// views for nodegod

var godmodel = require('../lib/godmodel')

module.exports = {
	index: index,
	setTitle: setTitle,
}

//
var appName
var launchTime
function index(request, res) {

	var socket = request.connection && request.connection.socket ||
		request.socket

	// client ip eg. '1.2.3.4'
	var clientIp = socket && socket.remoteAddress ||
			'?clientIp'

	var readWrite = clientIp == '127.0.0.1'

	var apps = godmodel.getApps()
	res.render('index', {
		title: appName,
		apps: apps,
		launch: launchTime,
		readWrite: readWrite,
	})
}

function setTitle(title) {
	appName = title
	launchTime  = Date.now()
}