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