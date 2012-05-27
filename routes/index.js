// index.js
// views for nodegod

var nodegod = require('../lib/nodegod')

module.exports = {
	index: index,
	setTitle: setTitle,
}

//
var appName
function index(req, res) {
	res.render('index', {
		title: appName,
		apps: nodegod.getApps(),
	})
}

function setTitle(title) {
	appName = title
}