void function(root){

	'use strict'

	var lookup = root['my:lookup']
	var exports = lookup('./system.browser')

	var resolveURI = lookup('./uri').resolveURI
	var toStringSource = lookup('./util').toStringSource

	var Loader = lookup('./loader').Loader

	var System = new Loader(null, {

		ScriptContext: function () {
			return {
				_context: createContext(),
				execute: function(code, global, uri) {
					try {
						var src =
							'with (this) {' +
								'return eval(' + toStringSource(code) + ')' +
							'}'
						//console.log(src)
						var f = new this._context.Function(src)
						return f.call(global)
					} catch(e) {
						if (e.stack)
							e.stack = uri + '\n' + e.stack + src
						else e.message += ' (' + uri + ') '
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
			get(url, function(err, result) {
				if (err) request.reject(err)
				else request.fulfill(result)
			})
		}

	})

	function createContext() {
		if (!document.body) return root
		var iframe = document.createElement('iframe')
		iframe.width = iframe.height = 0
		iframe.style.display = 'none'
		document.body.appendChild(iframe)
		iframe.src = 'javascript:'
		var global = iframe.contentWindow
		iframe.parentNode.removeChild(iframe).removeNode()
		iframe = null
		return global
	}

	function get(url, callback) {
		//console.log('get', url)
		var m = /^([a-z][a-z0-9._+-]*):(.*)$/i.exec(url)
		if (m) {
			var scheme = m[1].toLowerCase()
			//console.log('scheme', scheme)
			switch (scheme) {
				case 'data':
					var m = /([^,]*),(.*)/.exec(m[2])
					if (m) {
						var src = m[2]
						src = m[1].slice(-7) === ';base64' ? atob(m[2]) : decodeURI(m[2])
						//console.log(src)
						callback(null, {source: src, uri: url, type: m[1]})
					} else throw Error('Invalid URL:' + url)
					return
			}
		}

		var req = new XMLHttpRequest()
		req.open('GET', url, false)
		req.onreadystatechange = function(){
			if (req.readyState === 4) {
				callback(null, {
					source: req.responseText,
					uri: url,
					type: req.getResponseHeader('Content-Type')
				})
			}
		}
		try {
			req.send()
		} catch(e) {
			callback(e)
		}
	}

	exports.Loader = Loader
	exports.System = System
	exports.global = root

}(this)
