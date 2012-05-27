if(typeof NODEGOD=="undefined")NODEGOD={};(function(){var __stack={}
NODEGOD.app=function(locals){locals=locals||{};try{var buf = [];
with (locals) {
  buf.push('<!-- app.ejs\nrender one application provided in app\n-->\n<h2>', escape((__stack.lineno=4,  app.name )), '</h2>\n<p>id: ', escape((__stack.lineno=5,  app.id )), '\n	', escape((__stack.lineno=6,  app.start )), '\n	', escape((__stack.lineno=7,  app.currentState )), '\n	', escape((__stack.lineno=8,  app.state )), '\n	', escape((__stack.lineno=9,  app.watchFiles )), '\n</p>\n<!-- we can\'t show/hide until buttons on the page, so assume a state -->\n<button class=debug>Debug</button>\n<button class=nodebug style=display:none>No Debug</button>\n<button class=start>Start</button>\n<button class=restart style=display:none>Restart</button>\n<button class=stop style=display:none>Stop</button>\n');
}
return buf.join('');}catch(e){_ee(e,"app")}};function partial(n,v){var p=n.slice(n.lastIndexOf("/")+1)
return NODEGOD[p](v)}
function _ee(e,s){alert(e.toString()+" template:"+s+" line:"+__stack.lineno)}})();