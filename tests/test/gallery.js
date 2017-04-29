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

	/**
	 * Test gallery shallow.
	 */
	suite = new ZenSuite('/?json');
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

	/**
	 * Test gallery deep.
	 */
	suite = new ZenSuite('/?json=deep');
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

	/**
	 * Test gallery stats.
	 */
	describe('Stats', function() {

		/**
		 * Test a single album stat
		 */
		suite = new ZenSuite('/?json&popular-albums');
		suite.do('Single album stat', function() {
			suite.helpers.isGallery();

			it('Has popular album stats', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.album);
				should.exist(gallery.stats.album.popular);
			    gallery.stats.album.popular.should.have.length.of(1);
			});

			it('Does not have any image stats', function() {
				var gallery = this.response.body.gallery;
				should.not.exist(gallery.stats.image);
			});
		});


		/**
		 * Test multiple album stats with non-default lengths
		 */
		suite = new ZenSuite('/?json&popular-albums=2&latest-albums=3');
		suite.do('Multiple album stats with non-default lengths', function() {
			suite.helpers.isGallery();

			it('Has popular album stats of correct length', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.album);
				should.exist(gallery.stats.album.popular);
			    gallery.stats.album.popular.should.have.length.of(2);
			});

			it('Has latest album stats of correct length', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats.album.latest);
			    gallery.stats.album.latest.should.have.length.of(3);
			});

			it('Does not have any image stats', function() {
				var gallery = this.response.body.gallery;
				should.not.exist(gallery.stats.image);
			});
		});

		/**
		 * Test a multiple image stats with non-default lengths
		 */
		suite = new ZenSuite('/?json&popular-images=2&latest-images=3');
		suite.do('Multiple image stats with non-default lengths', function() {
			suite.helpers.isGallery();

			it('Has popular image stats of correct length', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.image);
				should.exist(gallery.stats.image.popular);
			    gallery.stats.image.popular.should.have.length.of(2);
			});

			it('Has latest image stats of correct length', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats.image.latest);
			    gallery.stats.image.latest.should.have.length.of(3);
			});			

			it('Does not have any album stats', function() {
				var gallery = this.response.body.gallery;
				should.not.exist(gallery.stats.album);
			});
		});

		/**
		 * Test a single image stat
		 */
		suite = new ZenSuite('/?json&popular-images');
		suite.do('Single image stat', function() {
			suite.helpers.isGallery();

			it('Has popular image stats', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.image);
				should.exist(gallery.stats.image.popular);
			    gallery.stats.image.popular.should.have.length.of(1);
			});

			it('Does not have any album stats', function() {
				var gallery = this.response.body.gallery;
				should.not.exist(gallery.stats.album);
			});
		});

		/**
		 * Test both an album and an image stat together.
		 */
		suite = new ZenSuite('/?json&popular-albums&popular-images');
		suite.do('Both an album and an image stat', function() {
			suite.helpers.isGallery();

			it('Has popular album stats', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.album);
				should.exist(gallery.stats.album.popular);
			    gallery.stats.album.popular.should.have.length.of(1);
			});

			it('Has popular image stats', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats.image);
				should.exist(gallery.stats.image.popular);
			    gallery.stats.image.popular.should.have.length.of(1);
			});
		});

		/**
		 * Test that bad album stat length input is handled
		 */
		suite = new ZenSuite('/?json&popular-albums=BAD_INPUT');
		suite.do('Album stat length - bad input', function() {
			suite.helpers.isGallery();

			it('Has popular album stats of default length', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.album);
				should.exist(gallery.stats.album.popular);
			    gallery.stats.album.popular.should.have.length.of(1);
			});
		});

		/**
		 * Test that decimal album stat length input is converted to closest int
		 */
		suite = new ZenSuite('/?json&popular-albums=2.2');
		suite.do('Album stat length - decimal input', function() {
			suite.helpers.isGallery();

			it('Has popular album stats of correct length', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.album);
				should.exist(gallery.stats.album.popular);
			    gallery.stats.album.popular.should.have.length.of(2);
			});
		});

		/**
		 * Test that too large album stat length input is handled
		 */
		suite = new ZenSuite('/?json&popular-albums=100');
		suite.do('Album stat length - too long', function() {
			suite.helpers.isGallery();

			it('Has popular album stats of default length', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.album);
				should.exist(gallery.stats.album.popular);
			    gallery.stats.album.popular.should.have.length.of(1);
			});
		});

		/**
		 * Test that too short album stat length input is handled
		 */
		suite = new ZenSuite('/?json&popular-albums=0');
		suite.do('Album stat length - too short', function() {
			suite.helpers.isGallery();

			it('Has popular album stats of default length', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.album);
				should.exist(gallery.stats.album.popular);
			    gallery.stats.album.popular.should.have.length.of(1);
			});
		});

		/**
		 * Test that bad image stat length input is handled
		 */
		suite = new ZenSuite('/?json&popular-images=BAD_INPUT');
		suite.do('Image stat length - bad input', function() {
			suite.helpers.isGallery();

			it('Has popular image stats of default length', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.image);
				should.exist(gallery.stats.image.popular);
			    gallery.stats.image.popular.should.have.length.of(1);
			});
		});

		/**
		 * Test that too large image stat length input is handled
		 */
		suite = new ZenSuite('/?json&popular-images=100');
		suite.do('Image stat length - too long', function() {
			suite.helpers.isGallery();

			it('Has popular image stats of default length', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.image);
				should.exist(gallery.stats.image.popular);
			    gallery.stats.image.popular.should.have.length.of(1);
			});
		});

		/**
		 * Test that too short image stat length input is handled
		 */
		suite = new ZenSuite('/?json&popular-images=0');
		suite.do('Image stat length - too short', function() {
			suite.helpers.isGallery();

			it('Has popular image stats of default length', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.image);
				should.exist(gallery.stats.image.popular);
			    gallery.stats.image.popular.should.have.length.of(1);
			});
		});

	});

});