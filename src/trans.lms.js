void function(root, factory){
	if (typeof require === 'function' && typeof exports === 'object' && exports) {
		// CommonJS Module/1.0+
		factory(require, exports)
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		// AMD or CMD
		define(factory)
	} else {
		var lookup = root['my:lookup']
		factory(lookup, lookup('./trans.lms'))
	}
}(this, function(require, exports){

	'use strict'

	var resolveURL = require('url').resolve
	var path = require('path')

	function myResolve(relURL, baseURL) {
		if (relURL.charAt(0) === '@') return relURL
		if (/^[a-z0-9]+:\/\//.test(baseURL)) return resolveURL(baseURL, relURL)
		if (baseURL.slice(-1) !== path.sep)
			baseURL = path.resolve(baseURL, '..')
		//console.log('resolve:', relURL, baseURL, require.resolve(path.resolve(baseURL, relURL)))
		try {
			return require.resolve(path.resolve(baseURL, relURL))
		} catch(e) {
			console.error('what?', baseURL, relURL, path.resolve(baseURL, relURL))
		}
	}

	exports.process = function myTransLMS(resource, relURL, baseURL, resolved) {

		var src = resource.source

		var importsLabel = /^\s*imports\s*:\s*(.*\S)\s*from\s*:\s*(.*\S)/gm
		src.replace(importsLabel, function(_0, names, module){
			names = names.replace(/\{\s*(.*\S)\s*\}/, '$1') // remove { ... }
			addImports(names.split(/\s*[;,]\s*/), module.replace(/\s*;$/, ''))
		})

		var exportsLabel = /^\s*exports\s*:\s*((var|function)\s+([^\s=(]+)|(.*\S))/gm
		src.replace(exportsLabel, function(_0, _1, _2, name, names){
			if (name) addExportNames([name])
			else {
				names = names.replace(/\s*;$/, '') // remove tailing whitespace and ";"
				names = names.replace(/\{\s*(.*\S)\s*\}/, '$1') // remove { ... }
				addExportNames(names.split(/\s*[;,]\s*/))
			}
		})

		function addImports(names, module) {
			var m = /(["'])(.*)\1;?/.exec(module)
			var mrl
			if (m) mrl = m[2]
			else return false
			for (var i = 0; i < names.length; i++) {
				if (!(/^[a-z_$][a-z0-9_$]*$/i.test(names[i])))
					return false
			}
			//console.log(module, exec(module))
			resource.addImports(names, null, mrl)
			return true
		}

		function addExportNames(names) {
			for (var i = 0; i < names.length; i++) {
				if (!(/^[a-z_$][a-z0-9_$]*$/i.test(names[i])))
					return false
			}
			resource.addExports(names)
			return true
		}

		//console.log('exports:', exportNames)

	}

})