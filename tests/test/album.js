'use strict';

/**
 * Test that album requests return the correct data
 */

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var ZenSuite = require('./scripts/zen_suite.js');

describe("Albums", function() {
	var suite;

	/**
	 * Test getting shallow album
	 */
	suite = new ZenSuite('/album1/?json&pagination=off')
	suite.do('Album - shallow', function() {
		suite.helpers.isAlbum();

		it('Has at least two images', function() {
			var album = this.response.body.album;
		    album.images.should.have.length.above(1);
		});

		it('First subalbum has no subalbums', function() {
			var album = this.response.body.album;
			should.not.exist(album.albums[0].albums);
		});		
	});

	/**
	 * Test getting deep, recursive album
	 */
	suite = new ZenSuite('/album1/?json=deep&pagination=off')
	suite.do('Album - deep', function() {
		suite.helpers.isAlbum();

		it('Has at least two images', function() {
			var album = this.response.body.album;
		    album.images.should.have.length.above(1);
		});

		it('First subalbum has at least two images', function() {
			var album = this.response.body.album;
		    album.albums[0].images.should.have.length.above(1);
		});

		it('First subalbum has at least one sub-subalbum', function() {
			var album = this.response.body.album;
		    album.albums[0].albums.should.have.length.above(0);
		});

		it('First sub-subalbum has at least two images', function() {
			var album = this.response.body.album;
		    album.albums[0].albums[0].images.should.have.length.above(1);
		});
	});

	/**
	 * Test that the first page of an album returns exactly the page limit of images.
	 */
	suite = new ZenSuite('/album3/?json')
	suite.do('Album - first page', function() {
		suite.helpers.isAlbum();

		it('Has full page of images', function() {
			var album = this.response.body.album;
		    album.images.should.have.length.of(20);
		});
	});

	/**
	 * Test that the last page of an album returns less than the page limit of images.
	 */
	suite = new ZenSuite('/album3/page/2/?json')
	suite.do('Album - last page', function() {
		suite.helpers.isAlbum();

		it('Does not have full page of images', function() {
			var album = this.response.body.album;
		    album.images.should.have.length.below(20);
		});
	});

	/**
	 * Test that an unpublished album gives a 404
	 */
	suite = new ZenSuite('/unpublished_album/?json')
	suite.do('Album - unpublished', function() {
		suite.helpers.isError(403);
	});	

});