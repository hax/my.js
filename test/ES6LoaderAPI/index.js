'use strict'
var assert = require('chai').assert
var Loader = require('../../src/loader').Loader

before(function(){
	this.assert = assert
	this.System = new Loader(null)
	this.Loader = Loader
})
after(function(){
	delete this.assert
	delete this.System
	delete this.Loader
})
require('./test')

