'use strict';

/**
 * Test that requests for the root gallery return the correct data
 */

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var ZenSuite = require('./scripts/zen_suite.js');

describe("Gallery", function() {
	var suite;

	suite = new ZenSuite('/?json')
	suite.do('Gallery - shallow', function() {
		suite.helpers.isGallery();

		it('Has at least 2 subalbums', function() {
			var gallery = this.response.body.gallery;
		    gallery.albums.should.have.length.above(1);
		});

		it('Has no images', function() {
			var gallery = this.response.body.gallery;
			should.not.exist(gallery.images);
		});

		it('First subalbum has no subalbums', function() {
			var gallery = this.response.body.gallery;
			should.not.exist(gallery.albums[0].albums);
		});		
	});

	suite = new ZenSuite('/?json=deep')
	suite.do('Gallery - deep', function() {
		suite.helpers.isGallery();

		it('First subalbum has at least two images', function() {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].images.should.have.length.above(1);
		});

		it('First subalbum has at least one sub-subalbum', function() {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].albums.should.have.length.above(0);
		});

		it('First sub-subalbum has at least two images', function() {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].albums[0].images.should.have.length.above(1);
		});
	});

});