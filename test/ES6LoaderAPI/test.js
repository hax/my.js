suite('ECMAScript 6 Loader API', function(){

	var assert, System, Loader
	before(function(){
		assert = this.assert
		System = this.System
		Loader = this.Loader
	})


	suite('system loader', function(){
		before(function(){
			this.loader = System
		})
		testLoader()
	})

	suite('customized loader', function(){
		before(function(){
			this.loader = new Loader(System)
		})
		testLoader()
		testEval()
		testHooks()
	})


	function testLoader() {

		var secret = {}

		test('set()', function(){
			this.loader.set('test', {
				name: 'test',
				hello: function(){ return 'Hello world!' },
				key: secret,
				constructor: 'ctor',
				toString: function(){ return this.name }
			})

			this.loader.set({
				'A': {name:'A'},
				'B': {name:'B'},
				'C': {name:'C'}
			})
		})

		test('get()', function(){
			var m = this.loader.get('test')

			assert.strictEqual(m.hello(), 'Hello world!')
			assert.strictEqual(m.key, secret)
			assert.strictEqual(m.constructor, 'ctor')
			assert.strictEqual(m.toString(), 'test')
			assert.isUndefined(m.valueOf)

			var A = this.loader.get('A')
			assert.strictEqual(A.name, 'A')
			var B = this.loader.get('B')
			assert.strictEqual(B.name, 'B')
			var C = this.loader.get('C')
			assert.strictEqual(C.name, 'C')
		})

		test('load() single module', function(done){
			this.loader.load('test', function(m){
				assert.strictEqual(m.hello(), 'Hello world!')
				assert.strictEqual(m.key, secret)
				assert.strictEqual(m.constructor, 'ctor')
				assert.strictEqual(m.toString(), 'test')
				assert.isUndefined(m.valueOf)
				done()
			})
		})

		test('load() multiple modules', function(done){
			this.loader.load(['A', 'B', 'C'], function(A, B, C){
				assert.strictEqual(A.name, 'A')
				assert.strictEqual(B.name, 'B')
				assert.strictEqual(C.name, 'C')
				done()
			})
		})

		test('load() should call errback if fail', function(done){
			this.loader.load('nonexist', null, function(e){
				done()
			})
		})

		var supportStrict = function(){
			'use strict'
			return this === undefined
		}()

		if (supportStrict) {
			test('module instance should be immutable', function(){
				'use strict'

				var A = this.loader.get('A')

				assert.strictEqual(A.name, 'A')

				assert.throws(function(){
					A.name = 'b'
				})
				assert.throws(function(){
					delete A.name
				})
			})
		} else {
			test('module instance should be isolated', function(){
				var A1 = this.loader.get('A')
				var A2 = this.loader.get('A')

				assert.strictEqual(A1.name, 'A')
				A1.name = 'b'
				assert.strictEqual(A2.name, 'A')
				delete A1.name
				assert.strictEqual(A2.name, 'A')
			})
		}

		var supportGetter = 'defineProperty' in Object || '__defineGetter__' in {}

		if (supportGetter) {
			test('module instance should provide exports as getters without setters', function(){
				var m = { key: secret }
				this.loader.set('test', m)
				var test = this.loader.get('test')
				assert.strictEqual(test.key, secret)
				var newSecret = {}
				try { test.key = newSecret } catch(e) {}
				assert.strictEqual(test.key, secret)
				m.key = newSecret
				assert.strictEqual(test.key, newSecret)
			})
		}

	}

	function testEval() {

		test('eval() should be able to access global', function(){

			var secret = {}

			var myLoader = new Loader(System, {global: {key: secret}})

			assert.strictEqual(myLoader.eval('key'), secret)
		})

		test('asyncEval() should be able to access global', function(done){

			var secret = {}

			var myLoader = new Loader(System, {global: {key: secret}})

			myLoader.evalAsync('key', function(result){

				assert.strictEqual(result, secret)

				done()
			})
		})

	}

	function testHooks() {

		test('resolve hook', function(){

			var secret = {}

			var myLoader = new Loader(System, {
				resolve: function(relURL, baseURL) {
					return relURL.toLowerCase()
				}
			})

			myLoader.set('test', {key: secret})
			var m1 = myLoader.get('test')
			var m2 = myLoader.get('TeST')
			var m3 = myLoader.get('tEst')

			assert.strictEqual(m1.key, m2.key)
			assert.deepEqual(m2, m3)
		})

		test('fetch hook', function(done){

			var secret = {}

			var myLoader = new Loader(System, {
				global: {secret: secret},
				fetch: function(relURL, baseURL, request, resolved) {
					if (relURL === 'test') request.fulfill({
						source: '({key: secret})'
					})
					else request.reject()
				}
			})

			myLoader.load('test', function(m){

				assert.strictEqual(m.key, secret)

				done()
			})
		})

		test('translate hook', function(done){

			var secret = {}

			var global = {secret: secret}

			global.System = new Loader(System, {
				global: global,
				fetch: function(relURL, baseURL, request, resolved) {
					if (relURL === 'test') request.fulfill({
						source: 'var a = "a", b = "b"'
					})
					else request.reject()
				},
				translate: function(resource, relURL, baseURL, resolved) {
					resource.source +=
						';System.set("' + relURL + '", {key: secret, a: a, b: b});'
					return resource
				}
			})

			global.System.load('test', function(m){

				assert.strictEqual(m.key, secret)
				assert.strictEqual(m.a, 'a')
				assert.strictEqual(m.b, 'b')

				done()
			})
		})

	}

})