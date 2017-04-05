'use strict';

/**
 * Test that search requests return the correct data
 */

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var ZenSuite = require('./scripts/zen_suite.js');

describe("Search", function() {
	var suite;

	/**
	 * Test a search with image results
	 */
	suite = new ZenSuite('/page/search/san francisco/?json')
	suite.do('Search - image results', function() {
		suite.helpers.isSearch();

		it('Has images', function() {
			var search = this.response.body.search;
			should.exist(search.images);
			search.images.should.be.an('array').and.have.length.above(4);
			should.exist(search.images[0].url_full);
		});		
	});

	/**
	 * Test a search with no results
	 */
	suite = new ZenSuite('/page/search/noSearchResultsHere/?json')
	suite.do('Search - no results', function() {
		suite.helpers.isSearch();

		it('Has no images', function() {
			var search = this.response.body.search;
			should.not.exist(search.images);
		});

		it('Has no albums', function() {
			var search = this.response.body.search;
			should.not.exist(search.albums);
		});
	});

});