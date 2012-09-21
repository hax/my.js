'import $ from "@jquery"'
'export {init, updateResult, updateOperator, clear}'

var resultEl, operatorEl

function init() {
	resultEl = $('#result')
	operatorEl = $('#operator')
}

function updateResult(val) {
	resultEl.text(val)
}

function updateOperator(val) {
	operatorEl.text(val)
}

function clear() {
	updateResult('0')
	updateOperator('')
}
