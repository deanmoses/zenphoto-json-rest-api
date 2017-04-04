'use strict';

/**
 * Test that image requests return the correct data
 */

var ZenSuite = require('./scripts/zen_suite.js');

describe("Images", function() {
	var suite;

	suite = new ZenSuite('/album1/image1.jpg/?json')
	suite.do('Basic image', function() {
		suite.helpers.isImage();
	});

	suite = new ZenSuite('/album1/image1.jpg/?json')
	suite.do('Image with more metadata', function() {

		suite.helpers.isImage();

		it('Has copyright', function(done) {
			var image = this.response.body.image;
		    image.copyright.should.equal('©Sample Copyright');
		    done();
		});

		it('Has correct top level location info', function(done) {
			var image = this.response.body.image;
		    image.city.should.equal('San Francisco');
		    image.state.should.equal('CA');
		    image.country.should.equal('USA');
		    done();
		});

		it('Has correct tags', function(done) {
			var image = this.response.body.image;
		    image.tags.should.be.an('array').and.include('test1');
		    done();
		});

		it('Has correct EXIF metadata', function(done) {
			var image = this.response.body.image;
		    image.metadata.EXIFMake.should.equal('Sony');
		    done();
		});
	});

});