zenphoto-rest-api
=================================

A Zenphoto plugin that provides a JSON REST API to albums and searches. Useful for building mobile apps and javascript-heavy web apps on top of Zenphoto.

The API is read-only.  It cannot create or modify albums or images.

## Installation
Place the plugin file in Zenphoto's `/plugins` directory and enable it through Zenphoto's web admin.

## Usage
Add "json" as a query string parameter to your URLs to get a JSON representation of the album or search results instead of the normal HTML.

Examples:
* `http://mysite.com/myAlbum/?json` returns myAlbum in JSON format
* `http://mysite.com/page/search/train?json` returns search results in JSON format

## Cross-domain AJAX
For security reasons it does not support AJAX requests from random domains. However, it does allow cross-domain AJAX from subdomains.   For example, you can have zenphoto on `mysite.com` and your web app on `app.mysite.com`.
