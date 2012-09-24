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