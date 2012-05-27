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
function index(req, res) {
	var apps = godmodel.getApps()
	res.render('index', {
		title: appName,
		apps: apps,
		launch: launchTime,
	})
}

function setTitle(title) {
	appName = title
	launchTime  = Date.now()
}