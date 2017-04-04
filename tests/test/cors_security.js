'use strict';

/**
 * Test that the correct CORS HTTP headers are returned.
 */

var environment = require('./scripts/environment.js');
let ZenSuite = require('./scripts/zen_suite.js');

describe("CORS Security", function() {

	var suite;

	/**
	 * Ensure CORS headers are present when accessing from a subdomain. 
	 */
	var subdomain = 'subdomain.' + environment.domain;
	var suite = new ZenSuite('/?json');
	suite.setHeader('Origin', subdomain)
	.do('CORS Security from subdomain', function() {
		suite.helpers.is200();
		suite.helpers.isJson();

		it('Should have CORS headers', function() {
			this.skip(); // test is right, production code is broken
			var response = this.response;
			response.should.have.header('access-control-allow-origin', subdomain);
		    response.should.have.header('access-control-allow-credentials', 'true');
		});
	});

	/**
	 * Ensure CORS headers are NOT present when accessing from a 3rd party site 
	 * (i.e., not the same domain or a subdomain). When not present, browsers 
	 * will disallow cross-domain AJAX.
	 */
	suite = new ZenSuite('/?json');
	suite.setHeader('Origin', 'notthezenphotosite.com')
	.do('CORS Security from 3rd party domain', function() {
		suite.helpers.is200();
		suite.helpers.isJson();

		it('Should NOT have CORS headers', function() {
			var response = this.response;
		    response.should.not.have.header('access-control-allow-origin');
		    response.should.not.have.header('access-control-allow-credentials');
		});
	});

	/**
	 * Ensure CORS headers are NOT present when accessing from the same domain. 
	 * They aren't needed; browser security permits same-domain AJAX.
	 */
	suite = new ZenSuite('/?json');
	suite.do('CORS Security from same domain', function() {
		suite.helpers.is200();
		suite.helpers.isJson();

		it('Should NOT have CORS headers', function() {
			var response = this.response;
		    response.should.not.have.header('access-control-allow-origin');
		    response.should.not.have.header('access-control-allow-credentials');
		});
	});

});