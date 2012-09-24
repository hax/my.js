var assert = require('chai').assert

before(function(){
	this.assert = assert
})

suite('resolveURI (node)', function(){
	before(function(){
		this.resolveURI = require('../src/uri.node').resolveURI
	})
	require('./URI')
})

suite('resolveURI', function(){
	before(function(){
		this.resolveURI = require('../src/uri').resolveURI
	})
	delete require.cache[require.resolve('./URI')]
	require('./URI')
})


suite('MY Module System', function(){

	var my = require('../my')
	my.global.assert = assert
	my.global.console = console
	//console.log('my', my)

	test('my loader', function(){
		assert.isDefined(my.load)
		console.log('url:', my.baseURL)
	})

	test('npm protocol', function(done){
		my.load('npm:assert', function(assert){
			assert(true)
			assert.ok(true)
			done()
		})
	})

	test('Labelled Module Statements', function(done){
		my.load('./LabelledModuleStatements', function(){
			done()
		})
	})

	/*test('Directive Prologues', function(done){
		my.load('./DirectivePrologues', done)
	})*/

/*	test('global', function(done){
		my.load('./global', done)
	})*/

})
