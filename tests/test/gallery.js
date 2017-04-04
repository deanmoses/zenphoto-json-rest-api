'use strict';

/**
 * Test that gallery requests return the correct data
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

		it('Has at least 2 subalbums', function(done) {
			var gallery = this.response.body.gallery;
		    gallery.albums.should.have.length.above(1);
		    done();
		});

		it('Has no images', function(done) {
			var gallery = this.response.body.gallery;
			should.not.exist(gallery.images);
		    done();
		});

		it('First subalbum has no subalbums', function(done) {
			var gallery = this.response.body.gallery;
			should.not.exist(gallery.albums[0].albums);
		    done();
		});		
	});

	suite = new ZenSuite('/?json=deep')
	suite.do('Gallery - deep', function() {
		suite.helpers.isGallery();

		it('First subalbum has at least two images', function(done) {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].images.should.have.length.above(1);
		    done();
		});

		it('First subalbum has at least one sub-subalbum', function(done) {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].albums.should.have.length.above(0);
		    done();
		});

		it('First sub-subalbum has at least two images', function(done) {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].albums[0].images.should.have.length.above(1);
		    done();
		});
	});

});