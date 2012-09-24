'use strict'
function assert(bool, message) {
	if (!bool) throw Error(message)
}
assert.ok = assert
assert.equal = function(result, expect) {
	this(result == expect, 'equal failed')
}
assert.strictEqual = function(result, expect) {
	this(result === expect, 'strictEqual failed')
}
assert.notStrictEqual = function(result, expect) {
	this(result !== expect, 'strictEqual failed')
}
assert.deepEqual = function(result, expect) {
	var msg = 'deepEqual failed'
	if (result === expect) return
	this(typeof result === 'object' && typeof expect === 'object', msg)
	if ('valueOf' in result) {
		this('valueOf' in expect, msg)
		var v = result.valueOf()
		if (typeof v !== 'object') {
			this(v !== expect.valueOf(), msg)
		}
	}
	for (var k in result) {
		this.deepEqual(result[k], expect[k], msg)
	}
}
assert.throws = function(callback) {
	try { callback() }
	catch(e) { return }
	this(false, 'throws failed')
}
assert.isNull = function(v) {
	this(v === null, 'isNull failed')
}
assert.isNotNull = function(v) {
	this(v !== null, 'isNotNull failed')
}
assert.isUndefined = function(v) {
	this(typeof v === 'undefined', 'isUndefined failed')
}
assert.isDefined = function(v) {
	this(typeof v !== 'undefined', 'isDefined failed')
}
