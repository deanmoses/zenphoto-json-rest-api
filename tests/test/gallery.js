'use strict';

/**
 * Test that gallery requests return the correct data
 */

var ZenSuite = require('./scripts/zen_suite.js');

describe("Gallery", function() {
	var suite;

	suite = new ZenSuite('/?json')
	suite.do('Gallery - shallow', function() {
		suite.helpers.isGallery();
	});

	suite = new ZenSuite('/?json=deep')
	suite.do('Gallery - deep', function() {
		suite.helpers.isGallery();
	});

});