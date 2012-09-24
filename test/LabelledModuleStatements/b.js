imports: {A1, A2, A3, A4} from: "a.js"
//imports: {A01} from: "a.js"
//imports: {A02, A03} from: "a.js"
//imports: {B1:A1; B2:A2} from: "a.js"
//imports: {A3; A04:A4} from: "a.js"

exports: function test() {
	assert.strictEqual(A1, 'A1')
	assert.strictEqual(A2(), 'A2')
	assert.strictEqual(A3 + '', 'A2')
	assert.equal(A4.test, 'A2')
}

/*
exports: function test() {
	console.log('test', A1, A2, A3, A4)
	assert.strictEqual(A01, 'A1')
	//assert.strictEqual(A01, B1)
	assert.strictEqual(A02(), 'A2')
	//assert.strictEqual(B2, A02)
	assert.strictEqual(A03 + '', 'A2')
	//assert.strictEqual(A3, A03)
	//assert.strictEqual(A04.test, 'A2')
}
*/