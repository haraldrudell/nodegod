// test-package.js
// tests your package consistency using a test from mochawrapper
// © Harald Rudell 2012

var testpackage = require('mochawrapper').packagetests

/*
provide the correct deployFolder for this project to the testing module.
Addresses situations where the mochawrapper code is in a symlinked location.
*/
testpackage['Package Consistency:']['DummyTest'](null, __dirname)
/*
exports the delegated package tests
Mocha will then find them in the project using mochawrapper
The real test resides in mochawrapper/lib/test-package.js
*/
module.exports = testpackage