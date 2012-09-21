var Mocha = require('mocha')
new Mocha({ui:'tdd'}).addFile('test').run()