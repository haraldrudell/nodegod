# ejsinbrowser
Packages ejs templates in an external javascript file so they can be rendered in the browser with no runtime overhead.
# Usage
in your express app.js:
```
app = createServer
...
require('ejsinbrowser').writeScript({
	folder: app.settings.views,
	ext: app.settings['view engine'],
	jsGlobalVariable: 'TEMPLATES',
	templates: 'partials',
	filename: __dirname + '/public/javascripts/templates.js'
})
```
This creates templates.js on server launch, and you can then in the browser page render the server's file views/partials/mypartial.ejs likeso:
```
<script src=/javascripts/templates.js></script>
<script>
var html = TEMPLATES.mypartial({ name: 'Rob' })
...
</script>
```
## Error Handling
Rendering exceptions are caught and displayed using alert:
"ReferenceError: gghhjj is not defined template:badtemplate line:2"

# Reference

## writeScript(opts)
* opt.folder: (optional) base folder for express templates, eg '/home/user/views'
* opt.ext: (optional) extension for express templates, eg. 'ejs'
* opt.jsGlobalVariable: global variable identifier used to accesss templates in browse, eg. 'TEMPLATES'
* opt.filename: the output filename eg. '/home/user/public/javascripts/templates.js'
* opt.templates: template filenames and folder names, single string or array
* opt.minify: minify the result

# Notes
* Templates are compiled server side on startup
* No JavaScript runtime is required in the browser
* Executable JavaScript functions are provided in the browser
* An alternative is to use underscore templates in express, see the module [uinexpress](https://github.com/haraldrudell/uinexpress)
