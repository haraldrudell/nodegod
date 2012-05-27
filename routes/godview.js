// index.js
// views for nodegod

var godmodel = require('../lib/godmodel')

module.exports = {
	index: index,
	setTitle: setTitle,
}

//
var appName
function index(req, res) {
	res.render('index', {
		title: appName,
		apps: godmodel.getApps(),
	})
}

function setTitle(title) {
	appName = title
}