// godview.js
// View for Node God
// © Harald Rudell 2011 MIT License

var godmodel = require('../godmodel')

module.exports = {
	index: index,
	setTitle: setTitle,
}

//
var appName
var launchTime = Date.now()
function index(request, res) {

	var socket = request.connection && request.connection.socket ||
		request.socket

	// client ip eg. '1.2.3.4'
	var clientIp = socket && socket.remoteAddress ||
			'?clientIp'

	var readWrite = clientIp == '127.0.0.1'

	var apps = godmodel.getApps()
	res.render('index', {
		title: appName,
		host: require('os').hostname(),
		apps: apps,
		launch: launchTime,
		readWrite: readWrite,
		dateString: dateString,
	})
}

function setTitle(title, launchTime0) {
	if (title) appName = title
	if (launchTime0) launchTime = launchTime0
}
// pacific time adjusted for daylight savings
var timezoneMinutesOffUtc = isDs(new Date()) ? -420 : -480
function dateString(value) {
	var result = '?'
	if (typeof value == 'number') {
		var str = new Date(value + timezoneMinutesOffUtc * 60000).toISOString()
		var hms = str.substring(11, 19)
		var date = str.substring(0, 10)
		if (timezoneMinutesOffUtc) {
			var absoluteValue = Math.abs(timezoneMinutesOffUtc)
			hms += (timezoneMinutesOffUtc < 0 ? '-' : '+') + getTwoDigits(absoluteValue / 60)
			var minutes = absoluteValue % 60
			if (minutes) hms += getTwoDigits(minutes)
		} else {
			hms += 'Z'
		}
		var result = hms + ' on ' + date
	}
	return result
}
function getTwoDigits(number) {
	var result = number.toString()
	if (result.length < 2) {
			result = '0' + result
	}
	return result
}
function isDs(dateUtc) {

	// calculate in the utc time zone
	// 2am est = 6am utc

	// Daylight time savings starts at 2 am est
	// The second Sunday in March
	// March 1, 2 am
	var year = dateUtc.getUTCFullYear()
	var march = 2
	var november = 10
	var dateDstBegin = new Date(Date.UTC(year, march, 1, 6))
	var weekday = dateDstBegin.getUTCDay()
	// number of days to get to second Sunday
	var days = weekday == 0 ? 7 : 14 - weekday
	dateDstBegin = new Date(Date.UTC(year, march, 1 + days, 6))

	// Daylight time savings ends at 2 am first Sunday in November est
	var dateDstEnd = new Date(Date.UTC(year, november, 1, 6))
	weekday = dateDstEnd.getUTCDay()
	if (days != 0) {
		dateDstEnd = new Date(Date.UTC(year, november, 1 + 7 - weekday, 6))
	}

	return dateUtc >= dateDstBegin && dateUtc < dateDstEnd
}
