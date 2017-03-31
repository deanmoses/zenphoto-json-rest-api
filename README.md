zenphoto-rest-api
=================================

A JSON REST API plugin for Zenphoto.  Useful for building mobile apps and javascript-heavy web apps on top of Zenphoto.

This is read-only.  It cannot create or modify albums or images.

## Installation
Place the plugin file in Zenphoto's `/plugins` directory and enable it through Zenphoto's web admin.

## Usage
Add "json" as a query string parameter to your URLs to get a JSON representation of the album or search results instead of the normal HTML response.

Examples:
* http://mysite.com/myAlbum/?json returns myAlbum in JSON format
* http://mysite.com/page/search/train?json returns search results in JSON format
