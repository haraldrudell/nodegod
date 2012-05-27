// logrequest.js
// log every incoming request

// imports
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
var timeUtil = haraldutil.timeUtil
// http://nodejs.org/docs/latest/api/util.html
var util = require('util')
// exports
module.exports.logrequest = init

// responderUri: string, regExp or array of those

function init(logger, ignoreTheseUris) {

	return function logAll(req, res, next) {

		// do not log no match in ignoreTheseUris
		var doLog

		if (Array.isArray(ignoreTheseUris)) {
			// every loops until false
			doLog = ignoreTheseUris.every(function (matcher) {
				return NoMatch(req.url, matcher)
			})
		} else {
			doLog = NoMatch(req.url, ignoreTheseUris)
		}

		if (doLog) logger(logString(req))
		next()

		function NoMatch(url, matcher) {
			var result
			if (matcher && matcher.constructor.name == 'RegExp') {
				result = !matcher.test(url)
			} else result = url != matcher
			return result
		}
	}

	// log requests
	//
	// data wanted: utc timestamp, request method, client address, server address, protocol, browser
	//
	// request: request object
	// return value: printable string describing the request

	function logString(request) {

		// retrieve information from the request

		// time: use now in utc: 2011-09-30T23:21Z
		var timeString = new Date().toISOString()

		// method is known to be a non-empty string
		var method = request.method // 'GET'

		// user agent: use non-empty user-agent header
		var userAgent = request.headers && request.headers['user-agent'] ||
			'?ua'

		// client information is either in x-forwarded* headers or in the socket

		// get the socket
		var socket = request.connection && request.connection.socket ||
			request.socket

		// client ip eg. '1.2.3.4'
		var clientIp = request.headers && request.headers['x-forwarded-for'] ||
			socket && socket.remoteAddress ||
			'?clientIp'

		// client port eg. 50000
		var clientPort = request.headers && request.headers['x-forwarded-port'] ||
			socket && socket.remotePort ||
			'?clientPort'

		// server: eg. 'localhost:80'
		var hostNameAndPort = request.headers && request.headers.host ||
			'host?'

		// uri and query string eg. '/page?q=1'
		var uri = request.url

		// protocol: 'http' or 'https'
		var protocol = request.headers && request.headers['x-forwarded-proto'] ||
			socket && socket.server && (socket.server.constructor.name == 'HTTPSServer' ? 'https' : 'http')

		// put together result
		var result = util.format('%s %s %s://%s%s %s:%s %s',
			timeString, method,
			protocol, hostNameAndPort, uri,
			clientIp, clientPort, userAgent)

		return result
	}

}
