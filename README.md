zenphoto-json-rest-api
=================================

A Zenphoto plugin that provides a JSON REST API to retrieve albums and run searches. 

It's useful for building mobile apps and javascript-heavy web apps on top of Zenphoto.

The API is read-only.  It cannot create or modify albums or images.

## Installation
1. Place `json_rest_api.php` in the `/plugins` folder of your Zenphoto installation
2. Activate the plugin from your Zenphoto administration panel, under the *Plugins* tab
    
## Usage
Use your normal gallery URLs but add a query string parameter named "`json`" to get a JSON representation.  This works for albums, images and search results.   

Use "`json=deep`" to return information about all descendant albums.  Otherwise it will only return information about immediate child albums.  `deep` is ignored on images and searches.

Examples:
* `http://mysite.com/myAlbum/?json` get JSON about myAlbum and its immediate children
* `http://mysite.com/myAlbum/?json=deep` get JSON  about myAlbum and all its descendants
* `http://mysite.com/myAlbum/myImage.jpg?json` get JSON about myImage.jpg
* `http://mysite.com/page/search/train/?json` get JSON search results about 'train'

## Cross-domain AJAX
For security reasons it does not support AJAX requests from random domains. However, it does allow cross-domain AJAX from subdomains.   For example, you can have zenphoto on `mysite.com` and your web app on `app.mysite.com`.
