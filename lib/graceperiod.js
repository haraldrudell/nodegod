// graceperiod.js
// Collate multiple events during a grace period
// © Harald Rudell 2013 MIT License

var defaultGrace = 1e3

exports.GracePeriod = GracePeriod

function GracePeriod(graceTimeMs, cb) {
	this.trigger = trigger
	this.enable = enable
	this.close = close
	var enabled = true
	var isClosed
	var firstArgs
	var tGraceEnd = 0
	var timer

	if (!graceTimeMs || graceTimeMs < 0) graceTimeMs = defaultGrace

	function trigger() {
		if (enabled) {
			if (!firstArgs) firstArgs = Array.prototype.slice.call(arguments)
			var now = Date.now()
			tGraceEnd = Math.max(tGraceEnd, now + graceTimeMs)
			if (!timer) timer = setTimeout(endOfGrace, tGraceEnd - now)
		}
	}

	function endOfGrace() {
		var now = Date.now()
		var remaining = tGraceEnd - now
		if (remaining > 0) timer = setTimeout(endOfGrace, remaining)
		else {
			timer = null
			var args = firstArgs || []
			firstArgs = null
			cb.apply(this, args)
		}
	}

	function enable(enableFlag) {
		if (!isClosed) {
			var result = enabled
			if (enableFlag != null) enabled = !!enableFlag
			return result
		}
	}

	function close() {
		isClosed = true
		if (timer) {
			var t = timer
			timer = null
			clearTimeout(t)
		}
		cb = null
	}
}
