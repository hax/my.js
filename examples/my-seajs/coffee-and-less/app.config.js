resource.mime.define({
	'text/coffeescript': ['coffee', 'cs'],
})
resource.type('text/coffeescript').use('./transpiler/coffee.js')
resource.uri('*.less').use('./transpiler/less.js')