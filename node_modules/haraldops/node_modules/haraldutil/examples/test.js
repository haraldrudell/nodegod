var haraldutil = require('../util.js')
timeUtil = haraldutil.timeUtil

timestamp = 1317660120
console.log('getDateString:',
  timeUtil.getDateString(timestamp, -240),
  timeUtil.getDateString(timestamp, 0),
  timeUtil.getDateString(timestamp, -420, true))
console.log('expected:      2011-10-03T12:42-04 2011-10-03T16:42Z 09:42-07')

for (a in 'abc') {
	console.log(a)
}

console.log('5,50:',
	testa(' 5 ', 5),
	testa(' 50 ', 50),
	testa(50, 50),
	testa(Object(50), 50),
	testa(Object(' 50 '), 50),
	testa(' 5.51 ', 5.51, true))

console.log('Nan:',
	testa(' 5 0 ', NaN),
	testa('50x', NaN),
	testa('5.0', NaN),
	testa(true, NaN),
	testa(null, NaN),
	testa(undefined, NaN),
	testa(({}), NaN),
	testa('', NaN),
	testa(' 5.51 ', NaN))

function testa(input, expected, flag) {
	var result = ''
	var value = haraldutil.toNumber(input, flag)
	if (value === expected || (isNaN(value) && isNaN(expected))) {
		result += 'ok'
	} else {
		result += 'input:' + typeof input + ':(' + input + ')'
		result += 'result:' + typeof value + ':' + value
	}
	return result
}

var f1 = 5
var f2 = Object(5)
console.log('typeof value:', typeof f1, typeof f2)
console.log('typeof', typeof f1 == 'number', typeof f2 == 'number')
console.log('instanceof', f1 instanceof Number, f2  instanceof Number)
