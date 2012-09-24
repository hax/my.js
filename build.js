var fs = require('fs')

var sourceDir = './src/'
var sourceFiles = [
	'my.lookup', 'util', 'meta.es5', 'meta',
	'trans.dp', 'trans.lms', 'my.module', 'uri',
	'loader', 'system.browser', 'my'
]
var dest = './dist/my.browser.js'

build()

sourceFiles[2] = 'meta.legacy'
dest = './dist/my.browser.legacy.js'
build()


function build() {
	var src = ''

	for (var i = 0; i < sourceFiles.length; i++) {
		var path = sourceDir + sourceFiles[i] + '.js'
		src += '//' + path + '\n' + fs.readFileSync(path) + '\n'
	}

	//console.log(src)
	fs.writeFileSync(dest, src)
}
