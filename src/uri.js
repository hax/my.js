void function(root, factory){
	if (typeof require === 'function' && typeof exports === 'object' && exports) {
		// CommonJS Module/1.0+
		factory(require, exports)
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		// AMD or CMD
		define(factory)
	} else {
		var lookup = root['my:lookup']
		factory(lookup, lookup('./uri'))
	}
}(this, function(require, exports){

	'use strict'

	exports.resolveURI = resolveURI

	function resolveURI(relURI, baseURI) {
		if (relURI === '' || relURI.charAt(0) === '#') {
			var i = baseURI.indexOf('#')
			return (i >= 0 ? baseURI.slice(0, i) : baseURI) + relURI
		}
		if (relURI.charAt(0) === '?') {
			var i = baseURI.search(/[?#]/)
			return (i >= 0 ? baseURI.slice(0, i) : baseURI) + relURI
		}
		var R = /^([^:/?#]+:)?(\/\/[^/?#]*)?([^?#]*)(.*)/.exec(relURI)
		if (R[1]) return R[1] + (R[2] || '') + removeDots(R[3]) + R[4]
		if (R[2]) return /^([^:/?#]+:)?/.exec(baseURI)[0] + R[2] + removeDots(R[3]) + R[4]
		if (R[3].charAt(0) === '/')
			return /^([^:/?#]+:)?(\/\/[^/?#]*)?/.exec(baseURI)[0] + removeDots(R[3]) + R[4]
		var B = /^(([^:/?#]+:)?(\/\/[^/?#]*)?)([^?#]*)/.exec(baseURI)
		return B[1] + removeDots(B[4], R[3]) + R[4]
	}

	function removeDots(path1, path2) {
		var result = []
		var segments = path1.split('/')
		if (path2) {
			segments.pop()
			;[].push.apply(segments, path2.split('/'))
		}
		for (var i = 0; i < segments.length; i++) {
			var seg = segments[i]
			switch (seg) {
				case '..': if (result.length > 1) result.pop()
				case '.': break
				default: result.push(seg)
			}
		}
		if (seg === '.' || seg === '..') result.push('')
		return result.join('/')
	}

})