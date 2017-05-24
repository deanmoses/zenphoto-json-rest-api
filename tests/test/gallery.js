'use strict';

/**
 * Test that requests for the root gallery return the correct data
 */

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var ZenSuite = require('./scripts/zen_suite.js');

describe('Gallery', function() {
	var suite;

	/**
	 * Test gallery depth = 0
	 */
	suite = new ZenSuite('/?json&depth=0');
	suite.do('Gallery - depth 0 (no subalbums)', function() {
		suite.helpers.isGallery();

		it('Has no subalbums', function() {
			var gallery = this.response.body.gallery;
			should.not.exist(gallery.albums);
		});

		it('Has no images', function() {
			var gallery = this.response.body.gallery;
			should.not.exist(gallery.images);
		});
	});

	/**
	 * Test gallery depth = 1
	 */
	suite = new ZenSuite('/?json&depth=1');
	suite.do('Gallery - depth 1 (just thumbs of subalbums)', function() {
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
	 * Test gallery depth = 1 by not having a depth parameter
	 */
	suite = new ZenSuite('/?json');
	suite.do('Gallery - depth 1 - default, no depth param', function() {
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
	 * Test gallery depth = 2
	 */
	suite = new ZenSuite('/?json&depth=2');
	suite.do('Gallery - depth 2', function() {
		suite.helpers.isGallery();

		it('Subalbum has at least two images', function() {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].images.should.have.length.above(1);
		});

		it('Subalbum has at least one subalbum', function() {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].albums.should.have.length.above(0);
		});

		it('Sub-subalbum images are not returned', function() {
			var gallery = this.response.body.gallery;
		    should.not.exist(gallery.albums[0].albums[0].images);
		});

		it('Sub-subalbum subalbums are not returned', function() {
			var gallery = this.response.body.gallery;
		    should.not.exist(gallery.albums[0].albums[0].albums);
		});
	});

	/**
	 * Test gallery infinite depth.
	 */
	suite = new ZenSuite('/?json&depth=-1');
	suite.do('Gallery - depth -1 (infinite)', function() {
		suite.helpers.isGallery();

		it('Subalbum has at least two images', function() {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].images.should.have.length.above(1);
		});

		it('Subalbum has at least one subalbum', function() {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].albums.should.have.length.above(0);
		});

		it('Sub-subalbum has at least two images', function() {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].albums[0].images.should.have.length.above(1);
		});

		it('Sub-subalbum has at least one subalbum', function() {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].albums[0].albums.should.have.length.above(0);
		});

		it('Sub-sub-subalbum has at least two images', function() {
			var gallery = this.response.body.gallery;
		    gallery.albums[0].albums[0].albums[0].images.should.have.length.above(1);
		});
	});

	/**
	 * Test gallery stats.
	 */
	describe('Stats', function() {

		/**
		 * Test a single album stat
		 */
		suite = new ZenSuite('/?json&popular_albums');
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
		 * Test a single album stat without getting any albums.
		 *
		 * This is mainly to compare perf between this and getting stats WITH getting the full gallery.
		 */
		suite = new ZenSuite('/?json&depth=0&popular_albums');
		suite.do('Single album stat with depth=0', function() {
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

			it('Has no subalbums', function() {
				var gallery = this.response.body.gallery;
				should.not.exist(gallery.albums);
			});

			it('Has no images', function() {
				var gallery = this.response.body.gallery;
				should.not.exist(gallery.images);
			});
		});

		/**
		 * Test multiple album stats with non-default lengths
		 */
		suite = new ZenSuite('/?json&popular_albums=count:2&latest_albums=count:3');
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
		suite = new ZenSuite('/?json&popular_images=count:2&latest_images=count:3');
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
		suite = new ZenSuite('/?json&popular_images');
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
		suite = new ZenSuite('/?json&popular_albums&popular_images');
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
		 * Test that bad album stat parameter is handled
		 */
		suite = new ZenSuite('/?json&popular_albums=BAD_INPUT');
		suite.do('Album stat - completely bad input', function() {
			suite.helpers.isGallery();

			it('Returns error message', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.error);
				gallery.stats.error.should.include('BAD_INPUT');
				gallery.stats.error.should.include('missing a colon');
				should.not.exist(gallery.stats.album);
				should.not.exist(gallery.stats.image);
			});
		});

		/**
		 * Test that bad album stat parameter is handled
		 */
		suite = new ZenSuite('/?json&popular_albums=count:1:');
		suite.do('Album stat - too many colons', function() {
			suite.helpers.isGallery();

			it('Has error message', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.error);
				gallery.stats.error.should.include('too many colons');
				should.not.exist(gallery.stats.album);
				should.not.exist(gallery.stats.image);
			});
		});

		/**
		 * Test that bad album stat length input is handled
		 */
		suite = new ZenSuite('/?json&popular_albums=count:BAD_INPUT');
		suite.do('Album stat length - bad input', function() {
			suite.helpers.isGallery();

			it('Has error message', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.error);
				gallery.stats.error.should.include('BAD_INPUT');
				gallery.stats.error.should.include('not numeric');
				should.not.exist(gallery.stats.album);
				should.not.exist(gallery.stats.image);
			});
		});

		/**
		 * Test that decimal album stat length input is converted to closest int
		 */
		suite = new ZenSuite('/?json&popular_albums=count:2.2');
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
		suite = new ZenSuite('/?json&popular_albums=count:100');
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
		suite = new ZenSuite('/?json&popular_albums=count:0');
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
		suite = new ZenSuite('/?json&popular_images=count:BAD_INPUT');
		suite.do('Image stat length - bad input', function() {
			suite.helpers.isGallery();

			it('Has error message', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.error);
				gallery.stats.error.should.include('BAD_INPUT');
				gallery.stats.error.should.include('not numeric');
				should.not.exist(gallery.stats.image);
				should.not.exist(gallery.stats.album);
			});
		});

		/**
		 * Test that bad image stat threshold input is handled
		 */
		suite = new ZenSuite('/?json&popular_images=threshold:BAD_INPUT');
		suite.do('Image stat threshold - bad input', function() {
			suite.helpers.isGallery();

			it('Has error message', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.error);
				gallery.stats.error.should.include('BAD_INPUT');
				gallery.stats.error.should.include('not numeric');
				should.not.exist(gallery.stats.image);
				should.not.exist(gallery.stats.album);
			});
		});

		/**
		 * Test that bad image stat deep input is handled
		 */
		suite = new ZenSuite('/?json&popular_images=deep:BAD_INPUT');
		suite.do('Image stat deep - bad input', function() {
			suite.helpers.isGallery();

			it('Has error message', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.error);
				gallery.stats.error.should.include('BAD_INPUT');
				gallery.stats.error.should.include('true');
				should.not.exist(gallery.stats.image);
				should.not.exist(gallery.stats.album);
			});
		});

		/**
		 * Test that bad image stat sort input is handled
		 */
		suite = new ZenSuite('/?json&popular_images=sort:BAD_INPUT');
		suite.do('Image stat sort - bad input', function() {
			suite.helpers.isGallery();

			it('Has error message', function() {
				var gallery = this.response.body.gallery;
				should.exist(gallery.stats);
				should.exist(gallery.stats.error);
				gallery.stats.error.should.include('BAD_INPUT');
				gallery.stats.error.should.include('asc');
				should.not.exist(gallery.stats.image);
				should.not.exist(gallery.stats.album);
			});
		});

		/**
		 * Test that too large image stat length input is handled
		 */
		suite = new ZenSuite('/?json&popular_images=count:100');
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
		suite = new ZenSuite('/?json&popular_images=count:0');
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