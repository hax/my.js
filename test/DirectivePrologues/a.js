'use strict'
'export A1'
'export {A2, A3}'
'export {A01: A1, A02: A2}'
'export {A03: A3, A4}'

var A1 = 'A1'

function A2() {
	return 'A2'
}

var A3 = {toString: A2}

var A4 = Object.create(null, {test: {get: A2}})
