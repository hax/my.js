void function(){
	'use strict'

	var meta = function(){
		
		var O = ({}.constructor)
		
		var hasOP = O.prototype.hasOwnProperty
		var isP = O.prototype.isPrototypeOf
		
		var exports = {
			hasOwnProperty: function(obj, name) {
				return hasOP.call(obj, name)
			},
			isPrototypeOf: function(p, o) {
				return isP.call(p, o)
			}
		}
		
		var methods = [
			'getPrototypeOf',
			'getOwnPropertyDescriptor',
			'getOwnPropertyNames',
			'create',
			'defineProperty',
			'defineProperties',
			'seal',
			'freeze',
			'preventExtensions',
			'isSealed',
			'isFrozen',
			'isExtensible',
			'keys',
		]
		
		for (var i = 0; i < methods.length; i++) {
			var m = methods[i]
			exports[m] = O[m]
		}
		
		return exports
		
	}()
		
	var loader = function(){
		if (typeof System !== 'undefined' &&
			typeof System.load === 'function' &&
			typeof System.get === 'function' &&
			typeof System.set === 'function' &&
			typeof Loader === 'function' &&
			System instanceof Loader) {
				var url = 'data:application/ecmascript;version=6,export System; export Loader'
				try {
					System.set(url, {System: System, Loader: Loader})
					var m = System.get(url)
					if (m.System === System && m.Loader === Loader) return m
				} catch(e) {}
		}
	}() || function(){
		
		function Module(m) {
			if (meta.getPrototypeOf(m) !== null &&
				m['[[Class]]'] === 'Module') return m
			var pds = {}
			var names = meta.getOwnPropertyNames(m)
			for (var i = 0; i < names.length; i++) {
				var name = names[i]
				pds[name] = {get: getter(name)}
			}
			pds['[[Class]]'] = {value: 'Module', enumerable: false}
			return meta.freeze(meta.create(null, pds))
			function getter(name) { return function() { return m[name] } }
		}
		
		function Loader(parent, options) {
			
			this._modules = meta.create(null)
			
			if (parent === null) {
				this._parent = null
				this._system = this
				if (options != null && typeof options.createScriptContext === 'function')
					this._createScriptContext = options.createScriptContext
				else throw Error('Invalid argument: options should be {createScriptContext: function() -> ScriptContext, ...} for initializing System loader')
			} else if (parent instanceof Loader) {
				this._parent = parent
				this._system = parent._system
			} else throw Error('Invalid argument type: parent should be Loader')
			
			var o = options != null ? options : {}
			
			if (o.global === undefined) this._global = null
			else if (o.global === null) this._global = meta.create(null)
			else if (typeof o.global === 'object') this._global = o.global
			else throw Error('Invalid argument type: options.global should be Object')
			
			if (o.linkedTo === undefined) this._linkedTo = parent
			else if (o.linkedTo instanceof Loader || o.linkedTo === null)
				this._linkedTo = o.linkedTo
			else throw Error('Invalid argument type: options.linkedTo should be Loader or null')
			
			this._scriptContext = this._linkedTo ?
				this._linkedTo._scriptContext :
				this._system._createScriptContext()
			
			if (o.baseURL === undefined) this._baseURL = null
			else if (typeof o.baseURL.valueOf === 'function'
				&& typeof o.baseURL.valueOf() === 'string')
					this._baseURL = String(o.baseURL)
			else throw Error('Invalid argument type: options.baseURL should be string')
			
			if (o.strict === undefined) this._strict = null
			else this._strict = !!o.strict
			
			this._hooks = {}
			var hooks = ['resolve', 'fetch', 'translate']
			for (var i = 0; i < hooks.length; i++) {
				var h = hooks[i]
				if (h in o)
					if (typeof o[h] === 'function')
						this._hooks[h] = o[h]
					else throw Error('Invalid argument type: options.' + h + ' should be function')
				else this._hooks[h] = null
			}
			
		}
		
		meta.defineProperties(Loader.prototype, {
			global: {get: function() {
				return this._global != null ? this._global : this._parent.global
			}},
			baseURL: {get: function() {
				return this._baseURL != null ? this._baseURL : this._parent.baseURL
			}},
			get: {value: function(mrl){
				var key = this._resolve(mrl, this.baseURL)
				return this._get(key)
			}},
			set: {value: function(mrl, module){
				var base = this.baseURL
				if (arguments.length >= 2) {
					var key = this._resolve(mrl, base)
					this._set(key, module)
				} else {
					var modules = mrl
					var mrls = meta.keys(modules)
					for (var i = 0; i < mrls.length; i++) {
						var mrl = mrls[i]
						var key = this._resolve(mrl, base)
						this._set(key, modules[mrl])
					}
				}
				return this
			}},
			_get: {value: function(key) {
				if (key in this._modules) {
					var m = this._modules[key]
					if ('instance' in m) return m.instance
					this._execute(m)
					return this._modules[key].instance
				} else return null
			}},
			_set: {value: function(key, mod) {
				var m = this._modules[key]
				if (m == null) this._modules[key] = {instance: Module(mod)}
				else m.instance = Module(mod)
			}},
			_execute: {value: function(m) {
				this._scriptContext.execute(m.content, this.global, m.url)
			}},
			_resolve: {value: function(mrl, baseURL) {
				var r = this._hooks.resolve
				while (typeof r !== 'function') {
					r = this._parent._hooks.resolve
				}
				return r(mrl, baseURL)
			}},
			_fetch: {value: function(mrl, baseURL, request, resolved) {
				var f = this._hooks.fetch
				while (typeof f !== 'function') {
					f = this._parent._hooks.fetch
				}
				f(mrl, baseURL, request, resolved)
			}},
			_translate: {value: function(resource, mrl, baseURL, resolved) {
				var loader = this
				while (loader !== null) {
					var t = loader._hooks.translate
					if (typeof t === 'function') {
						resource = t(resource, mrl, baseURL, resolved)
						console.info('translate', mrl)
						//console.log(resource.content)
					}
					loader = loader._parent
				}
				return resource
			}},
			_compile: {value: function(resource, resolved, callback, errback) {
				var that = this
				var count = 0
				function inc() {
					count++
					if (count >= resource.dependencies.length) {
						callback()
					}
				}
				function request(mrl, baseURL, resolved) {
					return {
						fulfill: function(resource){
							var resource = that._translate(resource, mrl, baseURL, resolved)
							that._compile(resource, resolved, inc, errback)
						},
						redirect: null, // TODO
						reject: errback
					}
				}
				console.log(resource.url, resolved, 'dependencies:', resource.dependencies)
				this._modules[resolved] = resource
				if (resource.dependencies.length > 0)
					for (var i = 0; i < resource.dependencies.length; i++) {
						var mrl = resource.dependencies[i]
						//console.log('mrl:', mrl)
						var key = this._resolve(mrl, resource.url)
						this._fetch(mrl, resource.url, request(mrl, resource.url, key), key)
					}
				else callback()
			}},
			load: {
				value: function(mrl, callback, errback){
					var async = arguments.length > 1
					if (typeof errback !== 'function')
						errback = function(e) { console.error(e.stack) }
					var base = this.baseURL
					var key = this._resolve(mrl, base)
					var that = this
					function load(){
						try {
							var m = that._get(key)
						} catch(e) {
							errback(e)
						}
						if (typeof callback === 'function') callback(m)
						return m
					}
					
					if (key in this._modules) {
						return async ? (load(), this) : load() 
					} else {
						var that = this
						this._fetch(mrl, base, {
							fulfill: function(resource){
								var resource = that._translate(resource, mrl, base, key)
								that._compile(resource, key, load, errback)
							},
							redirect: null, // TODO
							reject: errback
						}, key)
						return async ? this : null
					}
				}
			},
			eval: {
				value: function(){
				}
			},
			evalAsync: {
				value: function(){
				}
			},
			defineBuiltins: {
				value: function(obj){
					if (this._linkedTo === null) {
						return this._rootLoader.defineBuiltins(obj)
					} else {
						return this._linkedTo.defineBuiltins(obj)
					}
					var global = new Function('return this')()
		
					var obj = arguments.length > 0 ? arguments[0] : this._global
					var pds = {}
					meta.getOwnPropertyNames(this._intrinsics).forEach(function(name){
						pds[name] = meta.getOwnPropertyDescription(x, name)
					})
					meta.defineProperies(obj, pds)
					return obj
				}
			}
		})
		
		var System = NodeSystem() || BrowserSystem() || DefaultSystem()
		
		function NodeSystem() {
			if (typeof require !== 'function' || typeof process === 'undefined') return
			var vm = require('vm')
			if (vm == null ||
				typeof vm.createContext !== 'function' ||
				typeof vm.runInContext !== 'function') return
			
			var path = require('path'), fs = require('fs')
			function resolvePath(relPath, basePath) {
				console.log('resolve path:', relPath, 'of', basePath)
				if (basePath.slice(-1) !== path.sep)
					basePath = path.resolve(basePath, '..')
				return require.resolve(
					path.resolve(basePath, relPath)
				)
			}
			
			return new Loader(null, {
				createScriptContext: function(){
					return {
						_context: vm.createContext(),
						execute: function(code, global, url) {
							var pds = {}
							var names = meta.getOwnPropertyNames(global)
							for (var i = 0; i < names.length; i++) {
								var name = names[i]
								pds[name] = meta.getOwnPropertyDescriptor(global, name)
								pds[name].configurable = true
							}
							meta.defineProperties(this._context, pds)
							
							try {
								return vm.runInContext(code, this._context, url)
							} catch(e) {
								console.log(url)
								console.log(e.stack)
								console.log(code)
								throw e
							}
							
							var pds = {}
							var names = meta.getOwnPropertyNames(this._context)
							for (var i = 0; i < names.length; i++) {
								var name = names[i]
								pds[name] = meta.getOwnPropertyDescriptor(this._context, name)
								delete this._context[name]
							}
							meta.defineProperies(global, pds)
						}
					}
				},
				baseURL: module.parent.filename,
				resolve: function(relURL, baseURL) {
					return resolvePath(relURL, baseURL)
				},
				fetch: function(relURL, baseURL, request, resolved) {
					var f = resolvePath(relURL, baseURL)
					fs.readFile(f, 'utf-8', function(err, data) {
						if (err) request.reject(err)
						else request.fulfill({content:data, url:f})
					})
				},
				translate: function(resource, relURL, baseURL, resolved) {
					return resource
				}
			})
		}
		
		function BrowserSystem() {
		}
		
		function DefaultSystem() {
		}
		
		return {System: System, Loader: Loader}
		
	}()
	

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
			console.error('what?')
		}
	}
	

	//TODO: add module depedencicys and load it
	var myGlobal = {console:console}
	var myLoader = new loader.Loader(loader.System, {
		global: myGlobal,
		resolve: function(relURL, baseURL){
			return myResolve(relURL, baseURL)
		},
		translate: function(resource, relURL, baseURL, resolved) {
			resource.url = myResolve(relURL, baseURL)
			if (resource.dependencies == null)
				resource.dependencies = []
			var src = resource.content
			var imports = []
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
				resource.dependencies.push(mrl)
				for (var i = 0; i < names.length; i++) {
					imports.push({name: names[i], mrl: mrl})
				}
				return true
			}
			var exportNames = []
			function addExportNames(names) {
				for (var i = 0; i < names.length; i++) {
					if (!(/^[a-z_$][a-z0-9_$]*$/i.test(names[i])))
						return false
				}
				exportNames.push.apply(exportNames, names)
				return true
			}
			
			var importsLabel = /^\s*imports\s*:\s*(.*\S)\s*from\s*:\s*(.*\S)/gm
			src.replace(importsLabel, function(_0, names, module){
				names = names.replace(/\{\s*(.*\S)\s*\}/, '$1') // remove { ... }
				addImports(names.split(/\s*[;,]\s*/), module.replace(/\s*;$/, ''))
			})
			
			var exportsLabel = /^\s*exports\s*:\s*((var|function)\s+([^\s=(]*)|(.*\S))/gm
			src.replace(exportsLabel, function(_0, _1, _2, name, names){
				if (name != null) addExportNames([name])
				else {
					names = names.replace(/\s*;$/, '') // remove tailing whitespace and ";"
					names = names.replace(/\{\s*(.*\S)\s*\}/, '$1') // remove { ... }
					addExportNames(names.split(/\s*[;,]\s*/))
				}
			})
			
			//console.log('exports:', exportNames)
			
			var importPDs = []
			for (var i = 0; i < imports.length; i++) {
				var binding = imports[i]
				importPDs.push(binding.name + 
					': {get: function(){' + 
					'return $my$loader.get(' + 
					JSON.stringify(binding.mrl) + 
					').' + binding.name +
					'}}')
			}
			
			var exportPDs = []
			for (var i = 0; i < exportNames.length; i++) {
				var name = exportNames[i]
				exportPDs.push(name + ': {get: function(){ return ' + name + ' }}')
			}
			var src = src.replace(/^[\ufeff\ufffe]?(#!.*)?/, '')
			
			var code = 'console.log("baseURL:", $my$loader.baseURL, $my$loader._modules); with (Object.create(null,{' + importPDs.join(',') + '})) {' +
				'void function(){ arguments = undefined;' +
				'$my$loader.set(' + JSON.stringify(relURL) +
				', Object.create(null, {' + exportPDs.join(',') + '}));' + src + '}() }'
				
			//console.log(src)
			return Object.create(resource, {content:{value: code}})
		}
	})
	myGlobal.$my$loader = myLoader
	
	module.exports = myLoader
		
}()