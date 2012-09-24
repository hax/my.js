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