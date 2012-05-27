if(typeof NODEGOD=="undefined")NODEGOD={};(function(){var __stack={}
NODEGOD.app=function(locals){locals=locals||{};try{var buf = [];
with (locals) {
  buf.push('<!-- app.ejs\nrender one application provided in app\n-->\n<h2>', escape((__stack.lineno=4,  app.name )), '</h2>\n\n<ul>');__stack.lineno=6; for (var prop in app ) {
	if (typeof app[prop] == 'function' || prop == 'name')
		continue;; buf.push('\n	<li>', escape((__stack.lineno=9,  prop )), ': \n		');__stack.lineno=10; if (prop == 'watchFiles') { var files = app[prop]
			if (!files.length) { ; buf.push('None');__stack.lineno=11; } else { ; buf.push('\n			<ul>');__stack.lineno=12; files.forEach(function(file) { ; buf.push('\n				<li>', escape((__stack.lineno=13,  file )), '</li>\n			');__stack.lineno=14; }) ; buf.push('</ul>\n		');__stack.lineno=15; } } else { ; buf.push('\n		', escape((__stack.lineno=16,  app[prop] )), '');__stack.lineno=16; } ; buf.push('\n	</li>');__stack.lineno=17; } ; buf.push('\n</ul>\n<!-- we can\'t show/hide until buttons on the page, so assume a state -->\n<button class=debug>Debug</button>\n<button class=nodebug style=display:none>No Debug</button>\n<button class=start>Start</button>\n<button class=restart style=display:none>Restart</button>\n<button class=stop style=display:none>Stop</button>\n');
}
return buf.join('');}catch(e){_ee(e,"app")}};function partial(n,v){var p=n.slice(n.lastIndexOf("/")+1)
return NODEGOD[p](v)}
function _ee(e,s){alert(e.toString()+" template:"+s+" line:"+__stack.lineno)}})();