void function(root, factory){
	if (typeof require === 'function' && typeof exports === 'object' && exports) {
		// CommonJS Module/1.0+
		factory(require, exports)
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		// AMD or CMD
		define(factory)
	} else {
		var lookup = root['my:lookup']
		factory(lookup, lookup('./trans.dp'))
	}
}(this, function(require, exports){

	'use strict'

	exports.process = function myTransDP(resource, relURL, baseURL, resolved) {
		var src = resource.source
		var re = /^\s*((;)|((["']).*\4)|\/\/.*|\/\*[\s\S]*\*\/|([\w$!~{]))/
		var m, s
		while (m = re.exec(src)) {
			if (m[2]) { // semicolon
				if (!parse()) break
			} else if (m[3]) { // string literal
				if (s) if (!parse()) break
				s = m[3]
			} else if (m[5]) { // asi
				parse()
				break
			}
			src = src.slice(m[0].length)
		}

		function parse() {
			if (!s) return false
			try {
				s = s.slice(1, -1)
				var re = /^\s*(import|export|module)[\s{]/
				var m
				if (m = re.exec(s)) {
					s = s.slice(m[0].length - 1)
					switch (m[1]) {
						case 'module':
							var id = next(['id'])
							next('at')
							var sp = next('[string]', '[path]')
							resource.addImports([id], ['*'], sp)
							break
						case 'import':
							var imports = next('[imports]')
							next('from')
							var sp = next('[string]', '[path]')
							resource.addImports(imports, null, sp)
							break
						case 'export':
							var exports = next('[exports]')
							resource.addExports(exports, null)
							break
					}
					//TODO: comment processed directive
				}
			} catch (e) {
				console.warn(e)
				return false
			}
			s = null
			return true

			function next(type) {
				var idRe = /^\s*([\w$]+)/
				var pathRe = /^\s*([\w$]+(\.[\w$]+)*)/
				var strRe = /^\s*((["'])(.*)\2)/
				switch (type) {
					case '[string]':
					default:
						var m = re.exec(s)
						if (m) {
							s = s.slice(m[0])
							if (type && type !== m[1]) throw m[1]
							return m[1]
						} else throw null
				}
			}
		}
	}

})