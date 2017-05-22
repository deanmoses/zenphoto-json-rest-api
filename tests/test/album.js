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

	/**
	 * Test album stats.
	 */
	describe('Stats', function() {

		/**
		 * Test multiple album stats with non-default lengths
		 */
		suite = new ZenSuite('/album1/?json&latest_mtime_albums=count:2&latest_date_albums=count:3,deep:true');
		suite.do('Multiple album stats with non-default lengths', function() {
			suite.helpers.isAlbum();

			it('Has latest_mtime album stats of correct length', function() {
				var album = this.response.body.album;
				should.exist(album.stats);
				should.exist(album.stats.album);
				should.exist(album.stats.album.latest_mtime);
			    album.stats.album.latest_mtime.should.have.length.of(2);
			});

			it('Has latest_date album stats of correct length', function() {
				var album = this.response.body.album;
				should.exist(album.stats.album.latest_date);
			    album.stats.album.latest_date.should.have.length.of(3);
			});

			it('Does not have any image stats', function() {
				var album = this.response.body.album;
				should.not.exist(album.stats.image);
			});
		});

		/**
		 * Test album stat with deep:false (default, not specified)
		 */
		suite = new ZenSuite('/album1/?json&latest_albums');
		suite.do('Album stat deep:false (default, not specified)', function() {
			suite.helpers.isAlbum();

			it('Has latest album stats', function() {
				var album = this.response.body.album;
				should.exist(album.stats);
				should.exist(album.stats.album);
				should.exist(album.stats.album.latest);
			    album.stats.album.latest.should.have.length.of(1);
			});

			it('Latest album is a direct child', function() {
				var album = this.response.body.album;
				var latestAlbum = album.stats.album.latest[0];
			    // because deep=false, the album *must* be a direct child of album1
			    var numSlashes = (latestAlbum.path.match(/\//g) || []).length;
			    numSlashes.should.equal(1);
			});
		});

		/**
		 * Test album stat with deep:false
		 */
		suite = new ZenSuite('/album1?json&latest_albums=deep:false');
		suite.do('Album stat deep:false', function() {
			suite.helpers.isAlbum();

			it('Has latest album stats', function() {
				var album = this.response.body.album;
				should.exist(album.stats);
				should.exist(album.stats.album);
				should.exist(album.stats.album.latest);
			    album.stats.album.latest.should.have.length.of(1);
			});

			it('Latest album is a direct child', function() {
				var album = this.response.body.album;
				var latestAlbum = album.stats.album.latest[0];
			    // because deep=false, the album *must* be a direct child of album1
			    var numSlashes = (latestAlbum.path.match(/\//g) || []).length;
			    numSlashes.should.equal(1);
			});
		});

		/**
		 * Test album stat with deep:true
		 */
		suite = new ZenSuite('/album1?json&latest_albums=deep:true');
		suite.do('Album stat deep:true', function() {
			suite.helpers.isAlbum();

			it('Has latest album stats', function() {
				var album = this.response.body.album;
				should.exist(album.stats);
				should.exist(album.stats.album);
				should.exist(album.stats.album.latest);
			    album.stats.album.latest.should.have.length.of(1);
			});

			it('Latest album is not a direct child', function() {
				var album = this.response.body.album;
				var latestAlbum = album.stats.album.latest[0];
			    // because deep=true the album will be one of the deeper albums and not a direct child
			    var numSlashes = (latestAlbum.path.match(/\//g) || []).length;
			    numSlashes.should.be.at.least(2);
			});
		});


	});

});
