zenphoto-json-rest-api
=================================

A Zenphoto plugin that provides a JSON REST API to retrieve albums and run searches. 

It's useful for building mobile apps and javascript-heavy web apps on top of Zenphoto.

The API is read-only; it cannot create or modify albums or images.

## Installation
1. Place `json_rest_api.php` in the `/plugins` folder of your Zenphoto installation
2. Activate the plugin from your Zenphoto administration panel, under the *Plugins* tab
    
## Usage
Use your normal gallery URLs but add a query string parameter named "`json`" to get a JSON representation.  This works for albums, images and search results.

Use "`json=deep`" to return information about all descendant albums.  Otherwise it will only return information about immediate child albums.  `deep` has no effect on images and searches.

Use "`pagination=off`" to return the full unpaginated set of results.  Without this parameter, it will respect Zenphoto's normal pagination.  `pagination` has no effect on images.

Examples:
* `http://mysite.com/myAlbum/?json` get JSON about myAlbum and its immediate child albums
* `http://mysite.com/myAlbum/?json=deep` get JSON  about myAlbum and all its descendants
* `http://mysite.com/myAlbum/?json&pagination=off` get JSON about myAlbum and all its descendants, unpaginated
* `http://mysite.com/myAlbum/myImage.jpg?json` get JSON about myImage.jpg
* `http://mysite.com/page/search/train/?json` get JSON search results about 'train'
* `http://mysite.com/page/search/train/?json&pagination=off` get JSON search results about 'train', unpaginated
* `http://mysite.com/?json` get JSON about the gallery itself and the top-level albums
* `http://mysite.com/?json=deep` get JSON about the gallery itself and **EVERY ALBUM IN THE SYSTEM**
* `http://mysite.com/?json&pagination=off` get JSON about the gallery itself and the top-level albums, unpaginated

## Watch out for `json=deep`
It can be very expensive to get a giant set of nested albums.  I can't call this on my *own* root gallery of about 1000 albums and 25000 images because it times out.

## Cross-domain AJAX
For security reasons it does not support AJAX requests from random domains. However, it does allow cross-domain AJAX from subdomains.   For example, you can have zenphoto on `mysite.com` and your web app on `app.mysite.com`.

## Localization
The URLs above return the text content for your Zenphoto's default locale/language. If your Zenphoto is in multilingual mode, here's how to access language-specific content:
* Enable the official `seo_locale` plugin to allow switching the language via URL
* `http://mysite.com/<locale>/myAlbum/?json` now gets JSON about myAlbum in that locale, if any language-specific content exists.  Otherwise it gets content for the default language.
* Example: `http://mysite.com/de_DE/myAlbum/?json` would get the German content

This principle works with all the URLs above.
