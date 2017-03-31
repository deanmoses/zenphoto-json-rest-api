zenphoto-json-rest-api
=================================

A Zenphoto plugin that provides a JSON REST API to retrieve albums and run searches. 

It's useful for building mobile apps and javascript-heavy web apps on top of Zenphoto.

The API is read-only.  It cannot create or modify albums or images.

## Installation
1. Place `json_rest_api.php` in the `/plugins` folder of your Zenphoto installation
2. Activate the plugin from the Zenphoto administration panel, under the *Plugins* tab
    
## Usage
* Add "`json`" as a query string parameter to your gallery URLs to get a JSON representation of the album or search results instead of the normal HTML.   
* Add "`json=deep`" to return information about all descendant albums.  Otherwise it only includes immediate child albums.  This has no effect on image or album URLs.

Examples:
* `http://mysite.com/myAlbum/?json` returns info about myAlbum and its immediate children
* `http://mysite.com/myAlbum/?json=deep` returns info about myAlbum and all its descendants
* `http://mysite.com/myAlbum/myImage.jpg?json` returns info about myImage.jpg
* `http://mysite.com/page/search/train/?json` returns search results about 'train'

## Cross-domain AJAX
For security reasons it does not support AJAX requests from random domains. However, it does allow cross-domain AJAX from subdomains.   For example, you can have zenphoto on `mysite.com` and your web app on `app.mysite.com`.
