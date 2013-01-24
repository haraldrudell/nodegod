// parentloader.js
// Load app map from parent process
// © Harald Rudell 2012 MIT License

var masterlink = require('./masterlink')

var time500ms = 500
var masterLinkWait = time500ms

exports.load = load

function load(cb) {
	var result = {}
	var timer = setTimeout(end, masterLinkWait)

	masterlink.on('message', parseMessage)
	masterlink.write({getMap: 1})

	function parseMessage(data) {
		if (data.appMap) {
			result.appMap = data.appMap
			if (data.launchTime && typeof data.launchTime == 'number') result.time = data.launchTime
			end(true)
		}
	}

	function end(isMessage) {
		masterlink.removeListener('message', parseMessage)
		if (isMessage) {
			if (timer) {
				var t = timer
				timer = null
				clearTimeout(t)
			}
			cb(null, result)
		} else cb(new Error('Timeout with master process'))
	}
}
