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
	 * Test a search that returns images but no albums
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

		it('Has no albums', function() {
			var search = this.response.body.search;
			should.not.exist(search.albums);
		});
	});

	/**
	 * Test a search that returns albums but no images
	 */
	suite = new ZenSuite('/page/search/album1/?json')
	suite.do('Search - album results', function() {
		suite.helpers.isSearch();

		it('Has albums', function() {
			var search = this.response.body.search;
			should.exist(search.albums);
			search.albums.should.be.an('array').and.have.length.above(4);
			should.exist(search.albums[0].path);
		});

		it('Has no images', function() {
			var search = this.response.body.search;
			should.not.exist(search.images);
		});
	});

	/**
	 * Test a search that returns both albums and images
	 */
	suite = new ZenSuite('/page/search/title/?json')
	suite.do('Search - image and album results', function() {
		suite.helpers.isSearch();

		it('Has albums', function() {
			var search = this.response.body.search;
			should.exist(search.albums);
			search.albums.should.be.an('array').and.have.length.above(0);
			should.exist(search.albums[0].path);
		});

		it('Has images', function() {
			var search = this.response.body.search;
			should.exist(search.images);
			search.images.should.be.an('array').and.have.length.above(0);
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