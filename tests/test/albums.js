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

	suite = new ZenSuite('/album1/?json')
	suite.do('Album - shallow', function() {
		suite.helpers.isAlbum();

		it('Has at least two images', function(done) {
			var album = this.response.body.album;
		    album.images.should.have.length.above(1);
		    done();
		});

		it('First subalbum should have no subalbums', function(done) {
			var album = this.response.body.album;
			should.not.exist(album.albums[0].albums);
		    done();
		});		
	});

	suite = new ZenSuite('/album1/?json=deep')
	suite.do('Album - deep', function() {
		suite.helpers.isAlbum();

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