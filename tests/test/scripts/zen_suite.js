'use strict';

var chai = require('chai');
chai.use(require('chai-http'));
chai.use(require('chai-json-schema'));
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var helpers = require('./helpers.js');
var environment = require('./environment.js');
var path;

/**
 * ZenSuite: a class that simplifies creating a Mocha test suite over a HTTP request
 * to a Zenphoto installation.
 *
 * @param pathWithinZenphoto: 
 * 	    The path to Zenphoto resource, like '/myAlbum/myImage.jpg'
 *      Do NOT include the path to Zenphoto itself (so NOT '/zenphoto/myAlbum/...')
 */
var ZenSuite = function (pathWithinZenphoto = '/?json') {
	// Set up the request but do not send it yet
	this.request = chai.request(environment.zenphoto_server).get('/zenphoto' + pathWithinZenphoto);
};

/**
 * Make the helper methods available from suite.helpers.  
 * This is syntactic sugar so that the test files don't have to require() the helper script.
 */
ZenSuite.prototype.helpers = helpers;

/**
 * Set a header on the request
 */
ZenSuite.prototype.setHeader = function(headerName, headerValue) {
	this.request.set(headerName, headerValue);
	return this;
};

/**
 * Create and run a Mocha test suite
 */
ZenSuite.prototype.do = function(suiteName, testFunction) {
	// Make the request available to the before() function, whose .this  
	// is the Mocha context and not the ZenSuite object's context.
	var request = this.request;

	// describe(): the Mocha function that creates a test suite
	describe(suiteName, function() {
		// response: this variable is accessible to all the Mocha tests run
		// The before() function will set it
		var response;

		// before(): the Mocha function run before any test in the suite is run
		// Useful for setting up shared context... such as a HTTP request
	 	before(function(done) {
		  	request.send()
		  		.end(function(err, res) {
					// Make the response available to the parent describe() context
					response = res;
					done();
		  		});
		});

		// beforeEach(): the Mocha function run before each test in the suite
		beforeEach(function() {
			this.response = response; // make the response available to each test
		})

		// run the passed-in tests
		testFunction();
	});
};

module.exports = ZenSuite;