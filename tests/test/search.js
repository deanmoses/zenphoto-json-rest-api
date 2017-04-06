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

	describe('Search - unpaginated', function() {

		/**
		 * Test search that returns images but no albums
		 */
		suite = new ZenSuite('/page/search/san francisco/?json')
		suite.do('Search - image results', function() {
			suite.helpers.isSearch();
			hasImages(5);
			hasNoAlbums();
		});

		/**
		 * Test search that returns albums but no images
		 */
		suite = new ZenSuite('/page/search/album1/?json')
		suite.do('Search - album results', function() {
			suite.helpers.isSearch();
			hasAlbums(5);
			hasNoImages();
		});

		/**
		 * Test search that returns both albums and images
		 */
		suite = new ZenSuite('/page/search/title/?json')
		suite.do('Search - image and album results', function() {
			suite.helpers.isSearch();
			hasImages(5);
			hasAlbums(1);
		});	

		/**
		 * Test search that returns no results
		 */
		suite = new ZenSuite('/page/search/noSearchResultsHere/?json')
		suite.do('Search - no results', function() {
			suite.helpers.isSearch();
			hasNoImages();
			hasNoAlbums();
		});
	});

	describe('Search - paginated', function() {

		/**
		 * Test that the first page of search results returns exactly the page limit of images.
		 */
		suite = new ZenSuite('/page/search/san francisco/?json')
		suite.do('Album - first page', function() {
			suite.helpers.isSearch();

			it('Has full page of images', function() {
				var search = this.response.body.search;
			    search.images.should.have.length.of(20);
			});
		});

		/**
		 * Test that the last page of search results returns less than the page limit of images.
		 */
		suite = new ZenSuite('/page/search/san francisco/3/?json')
		suite.do('Album - last page', function() {
			suite.helpers.isSearch();

			it('Does not have full page of images', function() {
				var search = this.response.body.search;
			    search.images.should.have.length.below(20);
			});
		});	
	});
});

/**
 * Assert that the search returned at least imageCount images
 */
function hasImages(imageCount = 1) {
	it('Has images', function() {
		var search = this.response.body.search;
		should.exist(search.images);
		search.images.should.be.an('array').and.have.length.above(imageCount - 1);
		should.exist(search.images[0].url_full);
	});
};

/**
 * Assert that the search returned no images
 */
function hasNoImages() {
	it('Has no images', function() {
		var search = this.response.body.search;
		should.not.exist(search.images);
	});
 }

/**
 * Assert that the search returned at least albumCount albums
 */
function hasAlbums(albumCount = 1) {
	it('Has albums', function() {
		var search = this.response.body.search;
		should.exist(search.albums);
		search.albums.should.be.an('array').and.have.length.above(albumCount - 1);
		should.exist(search.albums[0].path);
	});
};

/**
 * Assert that the search returned no albums
 */
function hasNoAlbums() {
	it('Has no albums', function() {
		var search = this.response.body.search;
		should.not.exist(search.albums);
	});
}

