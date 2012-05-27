// pingerlist.js
// maintains status of all registered pingers

module.exports = constructor

// maintain the status of pingers that this server is monitoring
// maxAge: the maximum age of now timestamp
// idetifier: the app identifier returned for responder
// (affected by other server's clock inaccuracy and response time)
function constructor(identifier, maxAge) {
	// key: title of pinger
	// value : { period: second, last: unix timestamp }
	var pingerlist = {}
	if (typeof identifier != 'string') throw('opsconstructor: string identifier required')
	if (!maxAge) maxAge = 60

	return {
		addPinger: addPinger,
		getResponderString: getResponderString,
		updateSuccess: updateSuccess,
		checkResponse: checkResponse,
	}

	// save a new pinger
	function addPinger(title, period) {
		pingerlist[title] = {period: period, last: unixTimestampNow() }
	}

	// update last field for a test that just succeeded
	function updateSuccess(title) {
		pingerlist[title].last = unixTimestampNow()
	}

	// provide a status string for another server requesting it
	// result: string that can be sent over the web
	function getResponderString() {
		var object = pingerlist
		object[identifier] = unixTimestampNow()
		var string = JSON.stringify(object)
		return string
	}

	// we have pinged another pingerList server and got a response
	// check that the returned status string is ok
	// title: porintable string eg. 'Home Server'
	// string: the response body, should be text-json
	// app: the expected app eg. 'nodejs3'
	// return value: null: object and all checks are ok
	// otherwise: printable issue string
	function checkResponse(opts, string) {
		var result

		do {
			// convert response body json string to an object
			var object
			if (string != null && typeof string.valueOf() == 'string') {
				try {
					object = JSON.parse(string)
				} catch (e) { // ignore SyntaxError
				}
			}
			if (!object) {
				result = 'Response format not json'
				break
			}

			// check expected app identifier
			if (!object.hasOwnProperty(opts.app)) {
				result = 'Unmatched app name:' + opts.app
				break
			}

			// check age of the response
			var timestamp = getNumber(object, opts.app)
			if (result) break
			var now = unixTimestampNow()
			if (checkStale(now - timestamp, opts.maxAge || maxAge, 'stale response timestamp')) break

			// examine each pingresult entry
			for (var pingerTitle in object) {
				if (pingerTitle != opts.app) {
					var pingerObj = object[pingerTitle]
					var period = getNumber(pingerObj, 'period', pingerTitle)
					if (result) break
					var last = getNumber(pingerObj, 'last', pingerTitle)
					if (result) break
					var age = now - last
					if (checkStale(age, 2 * period, pingerTitle + ': stale success time')) break
				}
			}
		} while (false)

		// if troubles, add what server we were checking
		if (result) result = 'Checking ' + opts.title + ': ' + result

		return result

		function getNumber(obj, property, heading) {
			var num = obj[property]
			if (typeof num != 'number') {
				result = 
					(heading ? heading + ': ' : '') +
					'value not numeric:' + property
			}
			return num
		}

		function checkStale(age, maxAge, string) {
			var fail = age > maxAge
			if (fail) {
				result = string + ' s:' + age + ', max:' + maxAge
			}
			return fail
		}
	}

}

// get the current unix timestamp
function unixTimestampNow() {
	return Math.floor(Date.now() / 1000)
}
