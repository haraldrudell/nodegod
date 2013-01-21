// masterlink.js
// ipc link to master process
// © Harald Rudell 2012 MIT License

// process.send: possible function: sends data to master
// process message event: received data from master

var emitter = new (require('events').EventEmitter)
emitter.id = 'Master Link:' + process.pid

exports.on = function(e, f) {
	emitter.on.apply(emitter, [e, f])
	return this
}
exports.once = function(e, f) {
	emitter.once.apply(emitter, [e, f])
	return this
}
exports.write = write
exports.removeListener = function(e, f) {
	emitter.removeListener.apply(emitter, [e, f])
	return this
}

// messages from master process
process.on('message', emitMessage)
function emitMessage() {
	emitter.emit.apply(emitter, ['message'].concat(Array.prototype.slice.call(arguments)))
}

// messages to master process
function write(data) {
	if (typeof process.send == 'function') process.send(data)
	else console.log(emitter.id, 'ipc not available')
}