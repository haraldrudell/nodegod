// listenermanager.js
// Manage event listeners for various events.EventEmitters
// © Harald Rudell 2013 <harald@therudells.com> MIT License

exports.ListenerManager = ListenerManager

function ListenerManager() {
	var listeners = []
	this.addListener = addListener
	this.removeListeners = removeListeners

	/*
	object: events.EventEmitter
	fName: string: the function name to use 'on' or 'once'
	event: string: the event name eg. 'exit'
	listener: function: the event listener
	*/
	function addListener(object, fName, event, listener) {
		listeners.push({
			object: object[fName](event, listener),
			event: event,
			listener: listener,
		})
	}

	function removeListeners() {
		var list = listeners
		listeners = []
		list.forEach(function (o) {
			o.object.removeListener(o.event, o.listener)
		})
	}
}
