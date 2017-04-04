'use strict';

/**
 * Test that album requests return the correct data
 */

var ZenSuite = require('./scripts/zen_suite.js');

describe("Albums", function() {
	var suite;

	suite = new ZenSuite('/album1/?json')
	suite.do('Album - shallow', function() {
		suite.helpers.isAlbum();
	});

	suite = new ZenSuite('/album1/?json=deep')
	suite.do('Album - deep', function() {
		// not implemented
		it('First subalbum has at least two images', function(done) {
			var album = this.response.body.album;
		    album.albums[0].images.should.have.length.above(1);
		    done();
		});

		it('First subalbum has at least one sub-subalbum', function(done) {
			var album = this.response.body.album;
		    album.albums[0].albums.should.have.length.above(0);
		    done();
		});
	});

});