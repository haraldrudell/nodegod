// logger.js

exports.addLogging = addLogging
function addLogging(child, slogan) {
	addListener(child.stdout)
	addListener(child.stderr)

	function addListener(io) {
		if (io) {
			io.on('data', log).on('end', cleanUp)
			io.setEncoding('utf-8')
		}

		function cleanUp() {
			io.removeListener('data', log)
			io.removeListener('end', cleanUp)
		}
	}

	function log(str) {
		str.split('\n').forEach(function (line) {
			console.log(slogan, line)
		})
	}
}