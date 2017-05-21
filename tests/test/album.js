'use strict';

/**
 * Test that album requests return the correct data
 */

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var ZenSuite = require('./scripts/zen_suite.js');

describe('Albums', function() {
	var suite;

	/**
	 * Test album depth = 0 (no subalbums or images)
	 */
	suite = new ZenSuite('/album1/?json&depth=0');
	suite.do('Album - depth 0 (no subalbums)', function() {
		suite.helpers.isAlbum();

		it('Has no subalbums', function() {
			var album = this.response.body.album;
			should.not.exist(album.albums);
		});

		it('Has no images', function() {
			var album = this.response.body.album;
			should.not.exist(album.images);
		});
	});

	/**
	 * Test getting album at default depth (1)
	 */
	suite = new ZenSuite('/album1/?json&pagination=off')
	suite.do('Album - depth 1 (no depth parameter)', function() {
		suite.helpers.isAlbum();

		it('Has at least two images', function() {
			var album = this.response.body.album;
		    album.images.should.have.length.above(1);
		});

		it('Subalbum has no subalbums', function() {
			var album = this.response.body.album;
			should.not.exist(album.albums[0].albums);
		});		
	});

	/**
	 * Test getting album depth = 1
	 */
	suite = new ZenSuite('/album1/?json&depth=1')
	suite.do('Album - depth 1 (no depth parameter)', function() {
		suite.helpers.isAlbum();

		it('Has at least two images', function() {
			var album = this.response.body.album;
		    album.images.should.have.length.above(1);
		});

		it('Subalbum has no subalbums', function() {
			var album = this.response.body.album;
			should.not.exist(album.albums[0].albums);
		});		
	});

	/**
	 * Test gallery depth = 2
	 */
	suite = new ZenSuite('/album1/?json&depth=2');
	suite.do('Album - depth 2', function() {
		suite.helpers.isAlbum();

		it('Has at least two images', function() {
			var album = this.response.body.album;
		    album.images.should.have.length.above(1);
		});

		it('Subalbum has at least two images', function() {
			var album = this.response.body.album;
		    album.albums[0].images.should.have.length.above(1);
		});

		it('Subalbum has at least one subalbum', function() {
			var album = this.response.body.album;
		    album.albums[0].albums.should.have.length.above(0);
		});

		it('Sub-subalbum images are not returned', function() {
			var album = this.response.body.album;
		    should.not.exist(album.albums[0].albums[0].images);
		});

		it('Sub-subalbum subalbums are not returned', function() {
			var album = this.response.body.album;
		    should.not.exist(album.albums[0].albums[0].albums);
		});
	});

	/**
	 * Test getting album at depth -1 (infinite)
	 */
	suite = new ZenSuite('/album1/?json&depth=-1&pagination=off')
	suite.do('Album - depth -1 (infinite)', function() {
		suite.helpers.isAlbum();

		it('Has at least two images', function() {
			var album = this.response.body.album;
		    album.images.should.have.length.above(1);
		});

		it('Subalbum has at least two images', function() {
			var album = this.response.body.album;
		    album.albums[0].images.should.have.length.above(1);
		});

		it('Subalbum has at least one subalbum', function() {
			var album = this.response.body.album;
		    album.albums[0].albums.should.have.length.above(0);
		});

		it('Sub-subalbum has at least two images', function() {
			var album = this.response.body.album;
		    album.albums[0].albums[0].images.should.have.length.above(1);
		});

		it('Sub-subalbum has at least one subalbum', function() {
			var album = this.response.body.album;
		    album.albums[0].albums[0].albums.should.have.length.above(0);
		});

		it('Sub-sub-subalbum has at least two images', function() {
			var album = this.response.body.album;
		    album.albums[0].albums[0].albums[0].images.should.have.length.above(1);
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