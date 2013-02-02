// anytimer.js
// Provide equivalents for setTimeout and SetInterval facilitating any time period
// © 2013 Harald Rudell <harald@allgoodapps.com> MIT License

exports.AnyTimer = AnyTimer

var TIMEOUT_MAX = 2147483647
var time1day = 24 * 60 * 60 * 1e3

/*
Provide timer and interval
fn(): function
timeval: number: unit ms
isInterval: boolean

JavaScript setTimeout and setInterval can only handle periods of about 24 days
*/
function AnyTimer(fn, timeval, isInterval) {
	this.clear = clear
	var isClear
	if (!(timeval >= 1)) timeval = 1 // ensure number
	var baseTime = Date.now()
	var nextTargetTime = baseTime + timeval
	var timer
	var interval

	if (isInterval && timeval <= TIMEOUT_MAX) { // this actually works with setInterval
		interval = setInterval(fn, timeval)
	} else timerFire()

	function timerFire() {
		var remaining = nextTargetTime - Date.now()
		if (remaining <= 0) {
			timer = null
			fn()
			if (isInterval && !isClear) {
				nextTargetTime += isInterval
				setTimer(nextTargetTime - Date.now())
			}
		} else setTimer(remaining)
	}

	function setTimer(remaining) {
		if (remaining >= time1day) remaining = time1day
		timer = setTimeout(timerFire, remaining)
	}

	function clear() {
		isClear = true
		if (timer) {
			var t = timer
			timer = null
			clearTimeout(t)
		}
		if (interval) {
			var i = interval
			interval = null
			clearInterval(i)
		}
	}
}

function AnyInterval(fn, timeval) {
	this.clearInterval = clearInterval
	var baseTime = Date.now()
	var nextTargetTime = baseTime + timeval
	var timer

	timerFire()

	function timerFire() {
		var now = Date.now()
		var remaining = targetTime - now
		if (remaining <= 0) {
			timer = null
			fn()
		} else {
			if (remaining >= time1day) remaining = time1day
			timer = setTimeout(setTimer, remaining)
		}
	}

	function clearInterval() {
		if (timer) {
			var t = timer
			timer = null
			t.clearTimeout()
		}
	}
}
