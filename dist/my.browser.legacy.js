//./src/my.lookup.js
void function(root){
	var bag = {}
	root['my:lookup'] = function lookup(id) {
		return bag['$' + id] || (bag['$' + id] = {})
	}
}(this)
//./src/util.js
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
//./src/meta.legacy.js
void function(root, factory){
	if (typeof require === 'function' && typeof exports === 'object' && exports) {
		// CommonJS Module/1.0+
		factory(require, exports)
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		// AMD or CMD
		define(factory)
	} else {
		var lookup = root['my:lookup']
		factory(lookup, lookup('./meta.legacy'))
	}
}(this, function(_, exports){

	// meta shim for legacy hosts like IE 6, 7, 8

	var ObjProtoPropNames = [
		'constructor', 'hasOwnProperty', 'propertyIsEnumerable',
		'isPrototypeOf', 'toLocaleString', 'toString', 'valueOf'
	]

	function nakedObject() {
		var iframe = document.createElement('iframe')
		iframe.width = iframe.height = 0
		iframe.style.display = 'none'
		document.appendChild(iframe)
		iframe.src = 'javascript:'
		var proto = iframe.contentWindow.Object.prototype
		iframe.parentNode.removeChild(iframe).removeNode()
		iframe = null
		var names = ObjProtoPropNames
		for (var i = 0; i < names.length; i++) delete proto[names[i]]
		for (var k in proto) delete proto[k]
		return proto
	}

	var nullProto = nakedObject(), Ctor = function(){}

	function create(proto, pds) {
		Ctor.prototype = proto || nullProto
		var o = new Ctor
		o.__proto__ = proto
		if (pds) defineProperties(o, pds)
		return o
	}

	function getPrototypeOf(target) {
		return target.__proto__
	}

	function defineProperties(target, pds) {
		if (target.__pds__ == null) target.__pds__ = {}
		for (var k in pds) {
			if (pds.propertyIsEnumerable(k)) {
				var pd = target.__pds__[k] = pds[k]
				target[k] = pd.get ? pd.get.call(target) : pd.value
			}
		}
	}

	var hasOwn = {}.hasOwnProperty

	function getOwnPropertyDescriptor(target, name) {
		return name in target && hasOwn.call(target, name) ?
			{
				enumerable: target.propertyIsEnumerable(name),
				value: target[name],
				writable: true,
				configurable: true
			} : null
	}

	function getOwnPropertyNames(target) {
		var names = []
		for (var name in target) {
			if (hasOwn.call(target, name) && name !== '__proto__') names.push(name)
		}
		var bug = true
		for (var k in {toString: 0}) bug = false
		if (bug) {
			var buggyNames = ObjProtoPropNames
			for (var i = 0; i < buggyNames.length; i++) {
				var name = buggyNames[i]
				if (hasOwn.call(target, name)) names.push(name)
			}
		}
		return names
	}

	function keys(target) {
		var names = getOwnPropertyNames(target)
		// TODO: check propertyIsEnumerable?
		return names
	}

	function freeze(o) { return o }

	var defProp = {}.constructor.defineProperty

	var Bindings = defProp == null ? function(m) {
			return create(m, m.__pds__)
		} : function(){
		var sheet = document.createStyleSheet()
		var p = sheet.pages.constructor.prototype
		var f = function(){}

		defProp(p, 'item', {get:f})
		defProp(p, 'length', {get:f})
		defProp(p, 'constructor', {get:f})

		return function Bindings(m) {
			var i = sheet.addImport('about:blank')
			var o = sheet.imports[i].pages
			sheet.removeImport(i)
			//console.log(o.item, o.length, o.constructor)
			for (var k in m.__pds__) {
				var pd = m.__pds__[k]
				if (pd.get)
					defProp(o, k, {get:getter(pd.get)})
			}
			//o.__module__ = m
			return o
			function getter(get) {
				return function() { return get.call(m) }
			}
		}
	}()

	exports.create = create
	exports.proto = getPrototypeOf
	exports.defProps = defineProperties
	exports.ownDesc = getOwnPropertyDescriptor
	exports.ownNames = getOwnPropertyNames
	exports.keys = keys
	exports.freeze = freeze
	exports.Bindings = Bindings

})
//./src/meta.js
void function(root, factory){
	if (typeof require === 'function' && typeof exports === 'object' && exports) {
		// CommonJS Module/1.0+
		factory(require, exports)
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		// AMD or CMD
		define(factory)
	} else {
		var lookup = root['my:lookup']
		factory(lookup, lookup('./meta'))
	}
}(this, function(require, exports){

	// Minimal meta features for my.js module system

	'use strict'

	var util = require('./util')
	var meta = 'create' in {}.constructor ?
		require('./meta.es5') :
		require('./meta.legacy')

	function extend(obj, props) {
		var names = meta.ownNames(props), pds = {}
		for (var i = 0; i < names.length; i++) {
			var n = names[i], pd = meta.ownDesc(props, n)
			if (isCapitalized(n)) {
				pd.writable = pd.configurable = false
			}
			var pos = n.indexOf('_')
			if (pos >= 0) {
				var prefix = n.slice(0, pos)
				switch (prefix) {
					case '':
						pd.enumerable = false
						pos--
						break
					case 'readonly':
						pd.enumerable = pd.writable = false
						break
					case 'method':
						pd.enumerable = pd.writable = pd.configurable = false
						break
					case 'get': case 'set':
						pd[prefix] = pd.value
						delete pd.value
						delete pd.writable
						break
					default:
						throw Error('Unknown extension prefix: ' + prefix)
				}
				n = n.slice(pos + 1)
			}
			pds[n] = pd
		}
		meta.defProps(obj, pds)
	}
	function isCapitalized(s) {
		return !/(^|_)[a-z]/.test(s)
	}

	function Map() {
		this._keys = []
		this._values = []
		this._stringMap = meta.create(null)
	}
	extend(Map.prototype, {
		method_has: function has(key) {
			var k = stringKey(key)
			if (k != null) return k in this._stringMap
			return util.indexOf(this._keys, key) >= 0
		},
		method_get: function get(key) {
			var k = stringKey(key)
			if (k != null) return this._stringMap[k]
			var i = util.indexOf(this._keys, key)
			return i >= 0 ? this._values[i] : undefined
		},
		method_set: function set(key, val) {
			var k = stringKey(key)
			if (k != null) return this._stringMap[k] = val, this
			var i = util.indexOf(this._keys, key)
			if (i >= 0) this._values[i] = val
			else {
				this._keys.push(key)
				this._values.push(val)
			}
		},
		method_remove: function remove(key) {
			var k = stringKey(key)
			if (k != null) return delete this._stringMap[k]
			var i = util.indexOf(this._keys, key)
			if (i >= 0) {
				this._keys.splice(i, 1)
				this._values.splice(i, 1)
				return true
			} else return false
		}
	})
	function stringKey(key) {
		switch (key) {
			case undefined: return 'undefined'
			case null: return 'null'
			case true: return 'true'
			case false: return 'false'
		}
		switch (typeof key) {
			case 'string': return '$' + key
			case 'number':
				if (key === 0) return 1 / key === Infinity ? '+0' : '-0'
				return '' + key
		}
	}

	exports.create = meta.create
	exports.proto = meta.proto
	exports.ownNames = meta.ownNames
	exports.keys = meta.keys
	exports.freeze = meta.freeze
	exports.Bindings = meta.Bindings

	exports.extend = extend
	//exports.isCapitalized = isCapitalized
	exports.Map = Map
	//exports.stringKey = stringKey

})
//./src/trans.dp.js
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
//./src/trans.lms.js
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
//./src/my.module.js
void function(root, factory){
	if (typeof require === 'function' && typeof exports === 'object' && exports) {
		// CommonJS Module/1.0+
		factory(require, exports)
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		// AMD or CMD
		define(factory)
	} else {
		var lookup = root['my:lookup']
		factory(lookup, lookup('./my.module'))
	}
}(this, function(require, exports){

	'use strict'

	var util = require('./util')
	var meta = require('./meta')

	exports.Module = Module
	function Module(resource) {
		this.uri = resource.uri
		this.type = resource.type
		this.source = resource.source || resource.content
		this.instance = null
		this.references = []
		this.imports = []
		this.importNames = []
		this.exports = []
		this.exportNames = []
	}
	meta.extend(Module.prototype, {

		method_addImports: function(imports, names, module) {
			var i = this.referModule(module)
			append(this.imports[i], imports)
		},

		method_addExports: function(exports, names) {
			append(this.exports, exports)
		},

		method_referModule: function(module) {
			var i = util.indexOf(this.references, module)
			if (i >= 0) return i
			i = this.references.push(module) - 1
			this.imports[i] = []
			return i
		},

		method_translate: function() {

			process(this)
			//console.log('Code:\n', this.source)

			var importPDs = []
			for (var i = 0; i < this.imports.length; i++) {
				var bindings = this.imports[i]
				var mrl = util.toStringSource(this.references[i])
				for (var j = 0; j < bindings.length; j++) {
					var name = bindings[j]
					importPDs.push(name +
						': {get: function(){ return $my$loader.get(' + mrl + ').' + name + ' }}')
				}
			}

			var exportPDs = ['"[[Class]]":{value:"Module"}']
			for (var i = 0; i < this.exports.length; i++) {
				var name = this.exports[i]
				exportPDs.push(name + ': {get: function(){ return ' + name + ' }}')
			}

			var src = this.source.replace(/^[\ufeff\ufffe]?(#!.*)?/, '')
			var uri = util.toStringSource(this.uri)
			//console.log("baseURL:", $my$loader.baseURL, $my$loader._modules);
			var code = '/*console.log("baseURL:", $my$loader.baseURL, ' + uri + ');*/' +
				'void function($my$loader){ with ($create(null,{' + importPDs.join(',') + '})) {' +
				'void function(){ arguments = undefined;' +
				'$my$loader.set(' + uri +
				', $create(null, {' + exportPDs.join(',') + '}));' + src +
				'\n}() }}($create($my$loader, {_baseURL:{value:' + uri + '}}))'
				//

			//console.log(code)

			/*try {
				new Function(src)
			} catch(e) {
				console.error(e.message, 'src:', src)
				throw e
			}*/
			try {
				new Function(code)
			} catch(e) {
				console.error(e.message, ': ', code)
				throw e
			}
			//console.log('Code:\n', code)
			//return meta.create(this, {source:{value: code}})
			this.source = code
			return this
		}
	})

	var processors = []
	Module.addProcessor = function(proc) {
		if (typeof proc !== 'function') throw Error('proc should be function')
		processors.unshift(proc)
		return this
	}
	function process(m) {
		for (var i = 0; i < processors.length; i++) {
			processors[i](m)
		}
	}

	function append(a1, a2) {
		return [].push.apply(a1, a2)
	}
})
//./src/uri.js
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
//./src/loader.js
void function(root, factory){
	if (typeof require === 'function' && typeof exports === 'object' && exports) {
		// CommonJS Module/1.0+
		factory(require, exports)
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		// AMD or CMD
		define(factory)
	} else {
		var lookup = root['my:lookup']
		factory(lookup, lookup('./loader'))
	}
}(this, function(require, exports){

	// ES6 Loader API
	// See harmony draft:
	// http://wiki.ecmascript.org/doku.php?id=harmony:module_loaders

	'use strict'

	var util = require('./util')
	var meta = require('./meta')

	exports.Module = Module
	function Module(m) {
		if (meta.proto(m) === null && m['[[Class]]'] === 'Module') return m
		var pds = {}, names = meta.ownNames(m)
		for (var i = 0; i < names.length; i++) {
			var n = names[i]
			pds[n] = {get: getter(n), enumerable: true}
		}
		pds['[[Class]]'] = {value: 'Module'}
		return meta.freeze(meta.create(null, pds))

		function getter(name) {
			return function() { return m[name] }
		}
	}

	exports.Loader = Loader
	function Loader(parent, options) {

		var o = options != null ? options : {}

		if (parent === null) {
			this._parent = null
			this._system = this
			this._ScriptContext = 'ScriptContext' in o ?
				o.ScriptContext : function() {
					function ScriptContext() {}
					meta.extend(ScriptContext.prototype, {
						method_execute: function(code, global, uri) {
							try {
								return new Function(
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
					})
					return ScriptContext
				}()
		} else if (parent instanceof Loader) {
			this._parent = parent
			this._system = parent._system
		} else throw Error('Invalid argument: parent should be Loader')

		if (o.global == null) this._global = meta.create(null)
		else if (typeof o.global === 'object') this._global = o.global
		else throw Error('Invalid argument: options.global should be Object')

		if (o.linkedTo === undefined) this._linkedTo = parent
		else if (o.linkedTo instanceof Loader || o.linkedTo === null)
			this._linkedTo = o.linkedTo
		else throw Error('Invalid argument: options.linkedTo should be Loader or null')


		this._scriptContext = this._linkedTo ?
			this._linkedTo._scriptContext : new this._system._ScriptContext()

		if (o.baseURL === undefined) this._baseURL = this._parent != null ? this._parent._baseURL : ''
		else if (typeof o.baseURL === 'string' ||
			o.baseURL != null &&
			typeof o.baseURL.valueOf === 'function' &&
			typeof o.baseURL.valueOf() === 'string')
				this._baseURL = '' + o.baseURL
		else throw Error('Invalid argument: options.baseURL should be string')

		if (o.strict === undefined) this._strict = null
		else this._strict = !!o.strict

		this._hooks = {}
		var hooks = ['resolve', 'fetch', 'translate']
		for (var i = 0; i < hooks.length; i++) {
			var h = hooks[i]
			if (h in o)
				if (typeof o[h] === 'function') this._hooks[h] = o[h]
				else throw Error('Invalid argument: options.' + h + ' should be function')
		}

		this._modules = new meta.Map()

	}
	meta.extend(Loader.prototype, {
		get_global: function() {
			return this._global
		},
		get_baseURL: function() {
			return this._baseURL
		},
		method_get: function(mrl) {
			var key = this._resolve(mrl, this._baseURL)
			return meta.Bindings(this._get(key))
		},
		method_set: function(mrl, module) {
			var base = this._baseURL
			if (arguments.length >= 2) {
				var key = this._resolve(mrl, base)
				this._set(key, Module(module))
			} else {
				var modules = mrl
				var mrls = meta.keys(modules)
				for (var i = 0; i < mrls.length; i++) {
					var mrl = mrls[i]
					var key = this._resolve(mrl, base)
					this._set(key, Module(modules[mrl]))
				}
			}
			return this
		},
		_get: function(key) {
			//console.log('Loader._get', key)
			if (!this._modules.has(key)) return null
			var m = this._modules.get(key)
			if (m.instance != null) return m.instance
			var result = this._scriptContext.execute(m.source, this._global, m.uri || key)
			//console.log(m.source, m.instance, result)
			if (m.instance != null) return m.instance
			if (result != null) return m.instance = Module(result)
		},
		_set: function(key, instance) {
			if (this._modules.has(key)) {
				this._modules.get(key).instance = instance
			} else {
				this._modules.set(key, {instance: instance})
			}
		},
		_resolve: function(mrl, baseURL) {
			//console.log('resolve', mrl, baseURL)
			var loader = this
			do {
				if ('resolve' in loader._hooks)
					return loader._hooks.resolve(mrl, baseURL)
			} while (loader = loader._parent)
			return /^[a-z][a-z0-9.+-]*:/i.test(mrl) ?
				mrl : baseURL + '>' + mrl
		},
		_fetch: function(mrl, baseURL, request, resolved) {
			//console.log('fetch', mrl, baseURL, request, resolved)
			var loader = this
			do {
				if ('fetch' in loader._hooks)
					return loader._hooks.fetch(mrl, baseURL, request, resolved)
			} while (loader = loader._parent)
			request.reject('fetch is undefined')
		},
		_translate: function(resource, mrl, baseURL, resolved) {
			var loader = this
			do {
				if ('translate' in loader._hooks)
					resource = loader._hooks.translate(resource, mrl, baseURL, resolved)
			} while (loader = loader._parent)
			return resource
		},
		method_load: function(mrls, callback, errback){
			if (!util.isArray(mrls)) mrls = [mrls]
			if (typeof errback !== 'function')
				errback = function(e) { console.error(e, e.stack || '\n' + e.message) }
			var modules = [], count = mrls.length
			var base = this._baseURL

			for (var i = 0; i < mrls.length; i++) {
				var mrl = mrls[i]
				var key = this._resolve(mrl, base)
				var that = this
				var onload = function(i){
					return function(){
						try {
							modules[i] = meta.Bindings(that._get(key))
							if (--count === 0)
								if (typeof callback === 'function') {
									callback.apply(null, modules)
								}
						} catch(e) { errback(e) }
					}
				}(i)
				//console.log(key, this._modules.has(key))
				if (this._modules.has(key)) onload()
				else this._fetch(mrl, base, {
					fulfill: function(resource){
						that._compile(resource, mrl, base, key, onload, errback)
					},
					redirect: null, // TODO
					reject: errback
				}, key)
			}
			return this
		},
		method_eval: function(src) {
			var m = this._compile({source: src}, '', this._baseURL, undefined)
			return this._scriptContext.execute(m.source, this._global, this._baseURL)
		},
		method_evalAsync: function(src, callback, errback) {
			if (typeof errback !== 'function')
				errback = function(e) { console.error(e.stack) }
			var that = this
			this._compile({source: src}, '', this._baseURL, undefined, function(m){
				try {
					var result = that._scriptContext.execute(
						m.source, that._global, that._baseURL)
				} catch(e) { errback(e) }
				if (typeof callback === 'function') callback(result)
			}, errback)
		},
		method_defineBuiltins: function(obj) {
			if (obj == null) obj = this._global
			var intrinsics = this._scriptContext.execute('this') // TODO: get intrinsics
			//meta.defProps(obj, intrinsics)
			return obj
		},
		_compile: function(m, mrl, baseURL, resolved, callback, errback) {
			var sync = arguments.length <= 4
			if (m.instance == null) {
				try {
					var n = this._translate(m, mrl, baseURL, resolved)
					if (n != null) m = n
				} catch(e) { errback(e) }
			}
			if (resolved !== undefined) {
				if (this._modules.has(resolved) && this._modules.get(resolved).instance != null)
					throw Error('instance already ready!')
				this._modules.set(resolved, m)
			}
			if (m.references == null || m.references.length === 0) {
				if (sync) return m
				callback(m)
				return
			}
			var count = m.references.length
			for (var i = 0; i < m.references.length; i++) {
				var mrl = m.references[i]
				var key = this._resolve(mrl, m.uri)
				//console.log(mrl, m.uri, key)
				if (!this._modules.has(key)) {
					if (arguments.length <= 4) throw SyntaxError('eval remote result')
					this._fetch(mrl, m.uri, requestOf(this, mrl, m.uri, key), key)
				} else done()
			}
			function requestOf(loader, mrl, baseURL, resolved) {
				return {
					fulfill: function(resource){
						loader._compile(resource, mrl, baseURL, resolved, done, errback)
					},
					redirect: null, // TODO
					reject: errback
				}
			}
			function done() { if (--count <= 0) callback(m) }
		}
	})

})
//./src/system.browser.js
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

//./src/my.js
void function(root, factory){
	if (typeof require === 'function' && typeof exports === 'object' && exports) {
		// CommonJS Module/1.0+
		factory(require, exports)
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		// AMD or CMD
		define(factory)
	} else {
		var lookup = root['my:lookup']
		factory(lookup, lookup('./my'))
	}
}(this, function(require, exports){

	'use strict'

	var meta = require('./meta')

	var Module = require('./my.module').Module
	Module.
		addProcessor(require('./trans.dp').process).
		addProcessor(require('./trans.lms').process)

	NodeJS() || CommonJS() || Browser()

	function NodeJS() {
		if (typeof process !== 'undefined' && process &&
			process.versions && process.versions.node) {
				try {
					module.exports = MyLoader(require('./system.node'))
					return true
				} catch(e) {}
		}
	}

	function CommonJS() {
		//TODO
	}

	function Browser() {
		if (typeof document === 'undefined' || !document.createElement) return

		var api = require('./system.browser')

		api.global.System = MyLoader(api)
	}

	function MyLoader(api) {
		var global = {$create: meta.create}
		var myLoader = new api.Loader(api.System, {
			global: global,
			translate: function(resource, mrl, baseURL, resolved) {
				return new Module(resource).translate()
			}
		})
		global.$my$loader = myLoader
		return myLoader
	}

})
