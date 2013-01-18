// linearcalendar.js
// Provide linear algebra for months and years
// © Harald Rudell 2013 MIT License

var monthsPerYear = 12

var yearMonthZero
var zeroUtcFullYear
var zeroUtcMonth
encodeZero()

;[
encodeYears, encodeMonths, encodeDate, getDate, getTimeval,
].forEach(function (f) {exports[f.name] = f})

// convert integer relative years number to linearValue
function encodeYears(years) {
	checkNumber(years)
	return Math.floor(years) * monthsPerYear
}

// convert integer relative months number to linearValue
function encodeMonths(months) {
	checkNumber(months)
	return Math.floor(months)
}

// convert linearValue to timeval
function getTimeval(ymValue) {
	checkNumber(ymValue)
	return getDate(ymValue).getTime()
}

// convert linearValue to Date object
function getDate(ymValue) {
	checkNumber(ymValue)
	var utcFullYear = Math.floor(ymValue / monthsPerYear) + zeroUtcFullYear
	var utcMonth = modFix(Math.floor(ymValue), monthsPerYear) + zeroUtcMonth
	return new Date(Date.UTC(utcFullYear, utcMonth))
}

// get linearValue from Date object
function encodeDate(date) {
	if (!(date instanceof Date)) throw new Error('Value not Date: ' + date)
	return (date.getUTCFullYear() * monthsPerYear + date.getUTCMonth()) - yearMonthZero
}

// get linearValue for 1970-01-01T00:00:00.000Z
function getZero() {
	return yearMonthZero
}

function encodeZero() {
	var date = new Date(0) // 1970-01-01T00:00:00.000Z
	yearMonthZero = 0
	zeroUtcFullYear = date.getUTCFullYear() // 1970
	zeroUtcMonth = date.getUTCMonth() // 0
	yearMonthZero = encodeDate(date) // 23640 (1970 * 12)
}

function checkNumber(n) {
	if (isNaN(n)) throw new Error('Encountered NaN: ' + n)
	if (!isFinite(n)) throw new Error('Encountered infinite number: ' + n)
	if (Math.floor(n) != n) throw new Error('Encountered non-integer number: ' + n)
	if (n > 1e4) throw new Error('Encountered number greater than 10,000: ' + n)
}

function modFix(n, m) {
	return (n % m + m) % m
}