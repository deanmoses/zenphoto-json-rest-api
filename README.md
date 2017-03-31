zenphoto-json-rest-api
=================================

A Zenphoto plugin that provides a JSON REST API to retrieve albums and searches. 

It's useful for building mobile apps and javascript-heavy web apps on top of Zenphoto.

The API is read-only.  It cannot create or modify albums or images.

## Installation
1. Place `json_rest_api.php` in the `/plugins` folder of your Zenphoto installation.
2. Activate the plugin from the Zenphoto administration panel, under the *Plugins* tab.
3. Verify that you are shown a JSON file when browsing `[your gallery URL]/?json`.
    
## Usage
Add "`json`" as a query string parameter to your gallery URLs to get a JSON representation of the album or search results instead of the normal HTML.

Examples:
* `http://mysite.com/myAlbum/?json` returns myAlbum in JSON format
* `http://mysite.com/page/search/train/?json` returns search results in JSON format

## Cross-domain AJAX
For security reasons it does not support AJAX requests from random domains. However, it does allow cross-domain AJAX from subdomains.   For example, you can have zenphoto on `mysite.com` and your web app on `app.mysite.com`.
