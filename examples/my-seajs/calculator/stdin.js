'import $ from "@jquery"'
'import document from "@bom"'
'module calc at "calculator"'
'export init'

var specialKeys = {
	'8': 'delete',
	'13': 'enter',
	'27': 'esc'
}

function init() {

	$('#keyboard').delegate('div', 'click', function(){
		calc.handleInput($(this).text())
	})

	$(document).keypress(function(ev){
		var keyCode = ev.keyCode
		if (keyCode === 8) {
			ev.preventDefault()
		}

		var val = specialKeys[keyCode]
		if (!val) {
			val = String.fromCharCode(ev.which)
		}

		calc.handleInput(val)
	})

}
