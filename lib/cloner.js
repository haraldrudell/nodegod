// cloner.js
// Clone value
// © Harald Rudell 2013 MIT License

exports.clone = clone

/*
Clone an object and its enumerable properties
o: value of array, object and primitive properties

Array, Date and RegExp instances are cloned
other objects becomes Object objects, ie. Function, Error etc.
non-enumerable properties, getters and setters are not copied
*/
function clone(o) {
	var result

	if (o && typeof o === 'object') { // may have properties: objects other than null

		// instantiate object
		if (Array.isArray(o)) result = []
		else if (o instanceof Date) result = new Date(o.getTime())
		else if (o instanceof RegExp) {
			var flags =''
			if (o.ignoreCase) flags += 'i'
			if (o.multiline) flags += 'm'
			if (o.global) flags += 'g'
			result = new RegExp(o.source, flags)
		} else result = {}

		for (var property in o) { // copy enumerable properties
			result[property] = clone(o[property])
		}
	} else result = o // undefined null boolean number string

	return result
}