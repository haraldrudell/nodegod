// linearcalendar.js
// Provide linear algebra for months and years
// © Harald Rudell 2013

var monthsPerYear = 12

var yearMonthZero
var zeroUtcFullYear
var zeroUtcMonth
encodeZero()

;[
encodeYears, encodeMonths, encodeDate, getDate, getTimeval,
].forEach(function (f) {exports[f.name] = f})

function encodeYears(years) {
	return Math.floor(+years) * monthsPerYear
}

function encodeMonths(months) {
	return Math.floor(+months)
}

function getTimeval(ymValue) {
	return getDate(ymValue).getTime()
}

function getDate(ymValue) {
	var utcFullYear = Math.floor(ymValue / monthsPerYear) + zeroUtcFullYear
	var utcMonth = Math.floor(ymValue) % monthsPerYear + zeroUtcMonth
	return new Date(Date.UTC(utcFullYear, utcMonth))
}

function getZero() {
	return yearMonthZero
}

function encodeDate(date) {
	return (date.getUTCFullYear() * monthsPerYear + date.getUTCMonth()) - yearMonthZero
}

function encodeZero() {
	var date = new Date(0)
	yearMonthZero = 0
	zeroUtcFullYear = date.getUTCFullYear()
	zeroUtcMonth = date.getUTCMonth()
	yearMonthZero = encodeDate(date)
}