// nodereq.js
var nodegod = require('./nodegod')

module.exports = {
	getApps: getApps,
}

function getApps() {
	return nodegod.getApps()
}