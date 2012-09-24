'use strict'

exports: var A1 = 'A1'

function A2() {
	return 'A2'
}

var A3 = {toString: A2}

exports: {A2, A3}

var A4 = Object.create ?
	Object.create(null, {test: {get: A2}}) :
	{test: {valueOf: A2, toString: A2}}

exports: {A4}
//exports: {A01:A1; A02:A2}
//exports: {A03:A3; A4}