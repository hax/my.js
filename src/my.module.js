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
			var i = this.references.indexOf(module)
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
				var mrl = JSON.stringify(this.references[i])
				for (var j = 0; j < bindings.length; j++) {
					var name = bindings[j]
					importPDs.push(name +
						': {get: function(){ return $my$loader.get(' + mrl + ').' + name + ' }}')
				}
			}

			var exportPDs = []
			for (var i = 0; i < this.exports.length; i++) {
				var name = this.exports[i]
				exportPDs.push(name + ': {get: function(){ return ' + name + ' }}')
			}

			var src = this.source.replace(/^[\ufeff\ufffe]?(#!.*)?/, '')
			var uri = JSON.stringify(this.uri)
			//console.log("baseURL:", $my$loader.baseURL, $my$loader._modules);
			var code = '/*console.log("baseURL:", $my$loader.baseURL, ' + uri + ');*/' +
				'void function($my$loader){ with (Object.create(null,{' + importPDs.join(',') + '})) {' +
				'void function(){ arguments = undefined;' +
				'$my$loader.set(' + uri +
				', Object.create(null, {' + exportPDs.join(',') + '}));' + src +
				'\n}() }}(Object.create($my$loader, {_baseURL:{value:' + uri + '}}))'
				//

			try {new Function(src)} catch(e) {console.error('src:', e.stack)}
			try {new Function(code)} catch(e) {console.error('code:', code)}
			//console.log('Code:\n', code)
			return Object.create(this, {source:{value: code}})
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