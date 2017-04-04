'use strict';

/**
 * Test that nonexistent albums and images return a proper 404 HTTP response
 */

var ZenSuite = require('./scripts/zen_suite.js');

describe("404 Not Found", function() {
	var suite;

	suite = new ZenSuite('/noSuchAlbum?json')
	suite.do('404 Album Not Found', function() {
		suite.helpers.is404Json("Album does not exist.");
	});

	suite = new ZenSuite('/album1/noSuchImage.jpg?json')
	suite.do('404 Image Not Found', function() {
		suite.helpers.is404Json("Image does not exist.");
	});

});