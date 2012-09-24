void function(root, factory){
	if (typeof require === 'function' && typeof exports === 'object' && exports) {
		// CommonJS Module/1.0+
		factory(require, exports)
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		// AMD or CMD
		define(factory)
	} else {
		var lookup = root['my:lookup']
		factory(lookup, lookup('./util'))
	}
}(this, function(_, exports){

	'use strict'

	exports.toStringSource =
		typeof JSON !== 'undefined' && typeof JSON.stringify === 'function' ? JSON.stringify :
		''.toSource ? function(s) { return s.toSource() } :
		function(s) {
			return '"' + s.
				replace(/\\/g, '\\\\').
				replace(/"/g, '\\"').
				replace(/\r/g, '\\r').
				replace(/\n/g, '\\n') +
				'"'
		}

	exports.isArray = [].constructor.isArray ||
		function isArray(o) {
			return {}.toString.call(o) === '[object Array]'
		}

	exports.indexOf = [].indexOf ?
		function(a, e) { return a.indexOf(e) } :
		function indexOf(a, e) {
			for (var i = 0; i < a.length; i++) {
				if (a[i] === e) return i
			}
			return -1
		}

})