'use strict'
'import A01 from "a.js"'
'import {A02, A03} from "a.js"'
'import {B1: A1, B2: A2} from "a.js"'
'import {A3, A04: A4} from "a.js"'
'export test'

function test() {
	assert.strictEqual(A01, 'A1')
	assert.strictEqual(A01, B1)
	assert.strictEqual(A02(), 'A2')
	assert.strictEqual(B2, A02)
	assert.strictEqual(A03 + '', 'A2')
	assert.strictEqual(A3, A03)
	assert.strictEqual(A04.test, 'A2')
}
