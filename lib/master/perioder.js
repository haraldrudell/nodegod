// perioder.js
// Invoke a function on a certain schedule
// © Harald Rudell 2013

// http://nodejs.org/api/util.html
var util = require('util')
// http://nodejs.org/api/events.html
var events = require('events')

exports.TimeEmitter = TimeEmitter

var minRotate = 60
var time1s = 1e3
var time1day = 24 * 60 * 60 * time1s
/*
key: string period name
value: object
.interval optional timevalue for fixed interval
.atUnit timeval for unit of at

based on utc
*/
var periods = {
	'second': { // relative to time of construction
		interval: 60 * time1s,
		atUnit: time1s,
		atLessThan: 60,
		fromConstruction: true,
	},
	'minute': { // by minute of day
		interval: 60 * time1s,
		atUnit: time1s,
		atLessThan: 60,
	},
	'hour': { // by hour of day utc
		interval: 60 * 60 * time1s,
		atUnit: 60 * time1s,
		atLessThan: 60,
	},
	'day': {
		interval: time1day,
		atUnit: 60 * 60 * time1s,
		atLessThan: 24,
		atBaseOne: true
	},
	'month': {
		atUnit: time1day,
		atLessThan: 32,
		atBaseOne: true
	},
	'year': { // at unit is day
		atUnit: time1day,
		atLessThan: 366,
	},
}
// add self-named schedule property
for (var periodName in periods) periods[periodName].schedule = periodName

/*
Emit 'time' events on a schedule
opts: object
.schedule: optional string, default: 'month'
.at optional number default 0: offset within the period, unit depends on the selected schedule
.every optional number, default 1: how many periods between each event
*/
function TimeEmitter(opts) {
	events.EventEmitter.call(this)
	var self = this
	opts = parseOpts(opts)
	var period = periods[opts.schedule]
	var lastTimeval
	var lastTimerSet
	var timer
	var isTimeout

	this.cancel = function cancel() {
		if (timer) {
			var t = timer
			timer = null
			if (isTimeout) clearTimeout(t)
			else clearInterval(t)
		}
	}
	this.getState = function getState() {
		var result = {
			lastTimeval: lastTimeval,
			lastTimerSet: lastTimerSet,
			timer: !!timer,
			isTimeout: isTimeout,
		}
		for (var p in opts) result[p] = opts[p]
		return result
	}
	function fire() {
		if (isTimeout) rigTimer()
		self.emit('time')
	}
	rigTimer()

	/*
	Schedule the next setTimeout or setInterval
	premise: setInterval has not been invoked
	*/
	function rigTimer() {
		var date = new Date(lastTimerSet = Date.now())
		var isInterval

		switch (period.schedule) {
		case 'second': // first period is a timeout, then interval
			// first time: isTimeout === undefined, becomes true
			// second time: isTimeout === true, becomes false
			// no more invocations after that
			isInterval = isTimeout
			lastTimeval = !isTimeout ? opts.at * period.atUnit : opts.every * period.interval
			break
		case 'minute':
			isInterval = isTimeout
			if (!isTimeout) { // it's the first invocation
				var timeLeft = (opts.at - date.getUTCSeconds()) * period.atUnit
				lastTimeval = timeLeft >= 0 ? timeLeft : timeLeft + period.atLessThan* period.atUnit
			} else lastTimeval = opts.every * period.interval
			break
		case 'hour':
			isInterval = isTimeout
			if (!isTimeout) { // it's the first invocation
				var timeLeft = (opts.at - date.getUTCMinutes()) * period.atUnit
				lastTimeval = timeLeft >= 0 ? timeLeft : timeLeft += period.atLessThan* period.atUnit
			} else lastTimeval = opts.every * period.interval
			break
		case 'day':
			isInterval = isTimeout
			if (!isTimeout) { // it's the first invocation
				var timeLeft = (opts.at - date.getUTCHours()) * period.atUnit
				lastTimeval = timeLeft >= 0 ? timeLeft : timeLeft += period.atLessThan* period.atUnit
			} else lastTimeval = opts.every * period.interval
			break
		case 'month': // always setTimeout
			var month = date.getUTCMonth()
			var year = date.getUTCFullYear()
			var monthStart = new Date(Date.UTC(year, month, 1))
			if (++month > 11) {
				month = 0
				year++
			}
			var nextMonthStart = new Date(Date.UTC(year, month, 1))
			var dayInMonth = Math.floor((date - monthStart) / time1day)
			var timeLeft = (opts.at - date.getUTCDay()) * period.atUnit
			lastTimeval = timeLeft >= 0 ? timeLeft : (nextMonthStart - date) + opts.at * period.atUnit
			break
		case 'year': // always setTimeout
			var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
			var nextYearStart = new Date(Date.UTC(date.getUTCFullYear() + 1, 0, 1))
			var dayInYear = Math.floor((date - yearStart) / time1day)
			var timeLeft = (opts.at - dayInYear) * period.atUnit
			lastTimeval = timeLeft >= 0 ? timeLeft : (nextYearStart - date) + opts.at * period.atUnit
			break
		}

		// rig the timer
		timer = isTimeout = !isInterval ? setTimeout(fire, lastTimeval) : setInterval(fire, lastTimeval)
	}
}
util.inherits(TimeEmitter, events.EventEmitter)

function parseOpts(opts) {
	if (!opts) opts = {}

	// identify schedule
	var period = periods[opts.schedule] || periods.month
	var result = {
		schedule: period.schedule,
	}
	// determine at
	var at = !isNaN(opts.at) ? +opts.at : 0 // must be numeric
	if (period.atBaseOne) at--
	if (at < 0 || // not negative
		period.atLessThan && at >= period.atLessThan) // within atLessThan
		at = 0
	result.at = at

	// determine every
	var every = opts.every ? +opts.every : 1
	if (isNaN(every) || // must be a number
		every <= 0) // greater than 0
		every = 1
	result.every = every

	return result
}