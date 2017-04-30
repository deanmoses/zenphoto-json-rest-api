'use strict';

/**
 * Test that image requests return the correct data
 */

var ZenSuite = require('./scripts/zen_suite.js');

describe("Images", function() {
	var suite;

	/**
	 * Basic image test
	 */
	suite = new ZenSuite('/album1/image1.jpg/?json')
	suite.do('Basic image', function() {
		suite.helpers.isImage();
	});

	/**
	 * Test image with more metadata
	 */
	suite = new ZenSuite('/album1/image1.jpg/?json')
	suite.do('Image with more metadata', function() {

		suite.helpers.isImage();

		it('Has copyright', function() {
			var image = this.response.body.image;
		    image.copyright.should.equal('©Sample Copyright');
		});

		it('Has correct top level location info', function() {
			var image = this.response.body.image;
		    image.city.should.equal('San Francisco');
		    image.state.should.equal('CA');
		    image.country.should.equal('USA');
		});

		it('Has correct tags', function() {
			var image = this.response.body.image;
		    image.tags.should.be.an('array').and.include('test1');
		});

		it('Has correct EXIF metadata', function() {
			var image = this.response.body.image;
		    image.metadata.EXIFMake.should.equal('Sony');
		});
	});

	/**
	 * Test that an unpublished image gives a 403
	 */
	suite = new ZenSuite('/unpublished_image/unpublished.jpg?json')
	suite.do('Image - unpublished', function() {
		suite.helpers.isError(403);
	});

});