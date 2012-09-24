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