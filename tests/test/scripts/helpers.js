'use strict';

exports.hasVaryHeader = function() {
	it('Has Vary: Origin header', function(done) {
    	var response = this.response;
		response.should.have.header('vary', /^origin*/i);
		done();
	});
};

exports.is200 = function() {
    it('Is 200', function(done) {
    	var response = this.response;
        response.ok.should.be.true;
        response.should.have.status(200);
        response.statusType.should.equal(2);
        response.error.should.be.false;
        done();
    });

    this.hasVaryHeader();
};

exports.is404 = function() {
    it('Is 404', function(done) {
    	var response = this.response;
        response.ok.should.be.false;
        response.error.should.be.not.empty;
        response.clientError.should.be.true;
        response.serverError.should.be.false;
        response.should.have.status(404);
        response.statusType.should.equal(4);
        done();
    });

    this.hasVaryHeader();      
};

exports.isJson = function() {
	it('Is JSON', function(done) {
		var response = this.response;
		response.should.have.header('content-type', /^application\/json*/i);
		response.should.be.json;
		done();
	});
};

exports.is404Json = function(errorMessage) {
    this.is404();
    this.isJson();
    it('Has the 404 schema', function(done) {
    	var response = this.response;
        response.body.should.be.an('object').and.not.empty;
        response.body.should.be.jsonSchema(
            {
                "title": "404 Not Found",
                "description": "A Not Found response",
                "type": "object",
                "properties": {
                    "error": {
                        "type": "boolean"
                    },
                    "status": {
                        "type": "integer"
                    },
                    "message": {
                        "type": "string"
                    }
                },
                "required": ["error", "status", "message"]          
            }
        );
        done();
    });
    if (errorMessage) {
        it('404 message should match', function(done) {
        	var response = this.response;
            response.body.message.should.equal(errorMessage);
            done();
        });
    }
};


exports.isImage = function() {
    this.is200();
    this.isJson();

    it('should be an image', function(done) {
        var response = this.response;
        response.body.should.be.an('object').with.keys(['image']);
        response.body.image.should.be.an('object').and.not.empty;
        response.body.image.should.be.jsonSchema(
            {
                "title": "Image",
                "description": "A Zenphoto image",
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string"
                    },
                    "date": {
                        "type": "integer"
                    },
                    "title": {
                        "type": "string"
                    },
                    "desc": {
                        "type": "string"
                    },
                    "url_full": {
                        "type": "string"
                    },
                    "url_sized": {
                        "type": "string"
                    },
                    "url_thumb": {
                        "type": "string"
                    },
                    "width": {
                        "type": "integer"
                    },
                    "height": {
                        "type": "integer"
                    },
                    "index": {
                        "type": "integer"
                    },
                    "metadata": {
                        "type": "object"
                    }
                },
                "required": ["path", "date", "title", "desc", "url_full", "url_sized", "url_thumb", "width", "height", "index", "metadata"]
            }
        );
        done();
    });
};