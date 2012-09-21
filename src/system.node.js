'use strict'

var vm = require('vm')
var path = require('path'), fs = require('fs')

var m = module
while (m.parent) {
	m = m.parent
	var id = m.id.slice(m.id.lastIndexOf(path.sep) + 1)
	if (id !== 'my.js') break
}
var base = m.filename

var Loader = require('./loader').Loader

var System = new Loader(null, {

	ScriptContext: function() {
		return {
			_context: vm.createContext(),

			execute: function(code, global, uri) {

				// shallow copy from global to _context
				var pds = {}
				var names = Object.getOwnPropertyNames(global)
				for (var i = 0; i < names.length; i++) {
					var name = names[i]
					pds[name] = Object.getOwnPropertyDescriptor(global, name)
					pds[name].configurable = true
				}
				Object.defineProperties(this._context, pds)

				// execute code
				try {
					return vm.runInContext(code, this._context, uri)
				} catch(e) {
					//console.error(uri)
					console.error(e.stack)
					//console.log(code)
					throw e
				}

				// move all properties from _context back to global
				var pds = {}
				var names = Object.getOwnPropertyNames(this._context)
				for (var i = 0; i < names.length; i++) {
					var name = names[i]
					pds[name] = Object.getOwnPropertyDescriptor(this._context, name)
					delete this._context[name]
				}
				Object.defineProperies(global, pds)
			}
		}
	},

	baseURL: base,

	resolve: function(relURL, baseURL) {
		if (/^npm:/i.test(relURL))
			return relURL
		else
			return resolvePath(relURL, baseURL)
	},

	fetch: function(relURL, baseURL, request, resolved) {
		if (/^npm:/.test(relURL)) {
			request.fulfill({
				instance: require(relURL.slice(4)),
				uri: relURL
			})
		} else {
			var f = resolvePath(relURL, baseURL)
			fs.readFile(f, 'utf-8', function(err, data) {
				if (err) request.reject(err)
				else request.fulfill({source:data, uri:f})
			})
		}
	}
})

function resolvePath(relPath, basePath) {
	if (basePath.slice(-1) !== path.sep)
		basePath = path.resolve(basePath, '..')
	return require.resolve(
		path.resolve(basePath, relPath)
	)
}

exports.Loader = Loader
exports.System = System
