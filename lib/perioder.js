// perioder.js
// Invoke a function on a certain schedule
// © Harald Rudell 2013 MIT License

var linearcalendar = require('./linearcalendar')
// http://nodejs.org/api/util.html
var util = require('util')
// http://nodejs.org/api/events.html
var events = require('events')

exports.TimeEmitter = TimeEmitter

var minRotate = 60
var time1s = 1e3
var time1min = 60 * time1s
var time1h = 60 * time1min
var time1day = 24 * time1h

/*
key: string period name
value: object
.interval optional timevalue for fixed interval
.atUnit timeval for unit of at

based on utc
*/
var periods = {
	'second': { // relative to time of construction
		interval: time1s,
	},
	'minute': { // by minute of day
		interval: time1min,
		atUnit: time1s,
	},
	'hour': { // by hour of day utc
		interval: time1h,
		atUnit: time1min,
	},
	'day': {
		interval: time1day,
		atUnit: time1h,
		atBaseOne: true
	},
	'month': {
		atUnit: time1day,
		atBaseOne: true
	},
	'year': { // at unit is month
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
		var timeLeft

		switch (period.schedule) {
		case 'second': // every opts.every seconds since launch
			isInterval = true
			lastTimeval = opts.every * period.interval
			break
		case 'minute': // every opts.every minutes
		case 'hour': // first period opts.every hours + until at the following hour, then opts.every hours
		case 'day': // first period opts.every days + until at in the day, then opts.every days
			var periodTimeval = opts.every * period.interval // the time between two invocations
			// first invocation: isTimeout undefined -> isInterval false
			// second invocation: isTimeout true -> isInterval true
			isInterval = !!isTimeout
			if (!isInterval) { // it's the first period
				var inPeriod = lastTimerSet % periodTimeval // time elapsed in current epoch-based period
				var atTime = (opts.at % periodTimeval) * period.atUnit // at time in each period
				var timeLeft = atTime - inPeriod // time left to the next at time in this period
				if (timeLeft < 0) timeLeft += periodTimeval // it's passed, go to the next period
				lastTimeval = timeLeft
			} else lastTimeval = periodTimeval
			break
		case 'month': // at is fixed timeunit
			// figure out start of the current period and the next two periods
			var ymPeriod = linearcalendar.encodeMonths(opts.every)
			var ymNow = linearcalendar.encodeDate(date)
			var ymPeriodStart = ymNow - ymNow % ymPeriod
			var period0 = linearcalendar.getTimeval(ymPeriodStart)
			var period1 = linearcalendar.getTimeval(ymPeriodStart + ymPeriod)
			var period2 = linearcalendar.getTimeval(ymPeriodStart + 2 * ymPeriod)
			var atLeft = period0 + opts.at * period.atUnit - lastTimerSet
			if (atLeft < 0) {
				var nextAt = period1 + opts.at * period.atUnit
				if (nextAt >= period2) nextAt = period2 - time1day
				atLeft = nextAt - lastTimerSet
			}
			lastTimeval = atLeft
			break
		case 'year': // always setTimeout
			var ymPeriod = linearcalendar.encodeYears(opts.every)
			var ymNow = linearcalendar.encodeDate(date)
			var ymPeriodStart = ymNow - ymNow % ymPeriod
			var period0 = linearcalendar.getDate(ymPeriodStart)
			var period1 = linearcalendar.getDate(ymPeriodStart + ymPeriod)
			var period2 = linearcalendar.getDate(ymPeriodStart + 2 * ymPeriod)

			var period0At = linearcalendar.getDate(ymPeriodStart + opts.at)
			if (period0At > period1) period0At = period1 - time1day
			if (lastTimerSet < period0At) lastTimeval = period0At - lastTimerSet
			else {
				var period1At = linearcalendar.getDate(ymPeriodStart + ymPeriod + opts.at)
				if (period1At > period2) period1At = period2 - time1day
				lastTimeval = period1At - lastTimerSet
			}
			break
		}
		// rig the timer
		timer = (isTimeout = !isInterval) ? setTimeout(fire, lastTimeval) : setInterval(fire, lastTimeval)
	}
}
util.inherits(TimeEmitter, events.EventEmitter)


function parseOpts(opts) {
	if (!opts) opts = {}

	// identify schedule, default month
	var period = periods[opts.schedule] || periods.month
	var result = {
		schedule: period.schedule,
	}

	// determine at
	var at = !isNaN(opts.at) ? +opts.at : 0 // must be numeric
	if (period.atBaseOne) at--
	if (at < 0) at = 0 // at can not be negative
	result.at = at

	// determine every
	var every = opts.every ? +opts.every : 1
	if (isNaN(every) || // must be a number
		every <= 0) // greater than 0
		every = 1
	result.every = every

	return result
}