void function(root, factory){
	if (typeof require === 'function' && typeof exports === 'object' && exports) {
		// CommonJS Module/1.0+
		factory(require, exports)
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		// AMD or CMD
		define(factory)
	} else {
		var lookup = root['my:lookup']
		factory(lookup, lookup('./meta.es5'))
	}
}(this, function(_, exports){

	var O = {}.constructor

	exports.create = O.create
	exports.proto = O.getPrototypeOf
	exports.defProps = O.defineProperties
	exports.ownDesc = O.getOwnPropertyDescriptor
	exports.ownNames = O.getOwnPropertyNames
	exports.keys = O.keys
	exports.freeze = O.freeze
	exports.Bindings = function Bindings(o) { return o }

})