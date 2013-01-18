// test-linearcalendar.js
// © Harald Rudell 2013 MIT License

var linearcalendar = require('../lib/linearcalendar')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['LinearCalendar:'] = {
	'Exports': function () {
		assert.exportsTest(linearcalendar, 5)
	},
	'EncodeDate': function () {
		var dateValue = new Date(Date.UTC(2013, 6, 1))

		var actual = linearcalendar.encodeDate(dateValue)

		assert.equal(typeof actual, 'number')
		assert.ok(!isNaN(actual))
		assert.ok(isFinite(actual))
		assert.equal(Math.floor(actual), actual)
		assert.ok(actual > 0)
	},
	'GetTimeval': function () {
		var dateValue = new Date(Date.UTC(2013, 6, 1))

		var actual = linearcalendar.getTimeval(linearcalendar.encodeDate(dateValue))

		assert.equal(actual, dateValue.getTime(), 'getTimeval bad result: ' + new Date(actual).toISOString() + ' vs. ' + dateValue.toISOString())
	},
	'GetDate': function () {
		var dateValue = new Date(Date.UTC(2013, 6, 1))

		var actual = linearcalendar.getDate(linearcalendar.encodeDate(dateValue))

		assert.ok(actual instanceof Date)
		assert.equal(actual.toISOString(), dateValue.toISOString(), 'getDate bad result: ' + actual.toISOString() + ' vs. ' + dateValue.toISOString())
	},
	'EncodeMonths': function () {
		var monthsDiff = 100

		var y0 = 2013
		var m0 = 6
		var date0 = new Date(Date.UTC(y0, m0, 1))

		var y1 = y0 + Math.floor(monthsDiff / 12)
		var m1 = m0 + monthsDiff % 12
		if (m1 > 11) {
			y1++
			m1 -= 12
		}
		var date1 = new Date(Date.UTC(y1, m1, 1))

		var ym0 = linearcalendar.encodeDate(date0)
		var ym1 = ym0 + linearcalendar.encodeMonths(monthsDiff)
		var actual = linearcalendar.getDate(ym1)

		assert.equal(actual.toISOString(), date1.toISOString())
	},
	'EncodeYears': function () {
		var yearsDiff = -100

		var y0 = 2013
		var m0 = 6
		var date0 = new Date(Date.UTC(y0, m0, 1))

		var y1 = y0 + yearsDiff
		var m1 = m0
		var date1 = new Date(Date.UTC(y1, m1, 1))

		var ym0 = linearcalendar.encodeDate(date0)
		var ym1 = ym0 + linearcalendar.encodeYears(yearsDiff)
		var actual = linearcalendar.getDate(ym1)

		assert.equal(actual.toISOString(), date1.toISOString())
	},
}