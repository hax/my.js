void function(root, factory){
	if (typeof require === 'function' && typeof exports === 'object' && exports) {
		// CommonJS Module/1.0+
		factory(require, exports)
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		// AMD or CMD
		define(factory)
	} else {
		var lookup = root['my:lookup']
		factory(lookup, lookup('./system.browser'))
	}
}(this, function(require, exports){

	'use strict'

	var resolveURI = require('./uri').resolveURI

	var Loader = require('./loader').Loader

	var System = new Loader(null, {

		ScriptContext: function () {
			return {
				_context: createContext(),
				execute: function(code, global, uri) {
					try {
						return new this._context.Function(
							'with (this) {' +
								'return eval("' + code.replace(/"/g, '\\"') + '")' +
							'}'
						).call(global)
					} catch(e) {
						if (e.stack)
							e.stack = uri + '\n' + e.stack
						else e.message += ' (' + uri + ')'
						throw e
					}
				}
			}
		},

		baseURL: location.href,

		resolve: function(relURL, baseURL) {
			return resolveURI(relURL, baseURL)
		},

		fetch: function(relURL, baseURL, request, resolved) {
			var url = resolveURI(relURL, baseURL)
			get(url, function(err, data) {
				if (err) request.reject(err)
				else request.fulfill({source:data, uri:f})
			})
		}

	})

	function createContext() {
		var iframe = document.createElement('iframe')
		iframe.width = iframe.height = 0
		iframe.style.display = 'none'
		document.appendChild(iframe)
		iframe.src = 'javascript:'
		var global = iframe.contentWindow
		iframe.parentNode.removeChild(iframe).removeNode()
		iframe = null
		return global
	}

	function get(url, callback) {
		var req = new XMLHttpRequest()
		req.open('GET', url, false)
		req.onreadystatechange = function(){
			if (req.readyState === 4) {
				callback(null, req.responseText)
			}
		}
		req.send()
	}

})