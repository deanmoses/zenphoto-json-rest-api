zenphoto-json-rest-api
=================================

A Zenphoto plugin that provides a JSON REST API to retrieve albums and run searches. 

It's useful for building mobile apps and javascript-heavy web apps on top of Zenphoto.

The API is read-only; it cannot create or modify albums or images.

PHP 5.4+ required.

## Installation
1. Place `json_rest_api.php` and the folder `json_rest_api` in the `/plugins` folder of your Zenphoto installation
2. Activate the plugin from your Zenphoto administration panel, under the *Plugins -> Development* tab
    
## Usage
Use your normal gallery URLs but add a query string parameter named "`json`" to get a JSON representation.

Albums:
* `http://mysite.com/myAlbum/?json` get JSON about myAlbum and its immediate child albums

Images:
* `http://mysite.com/myAlbum/myImage.jpg?json` get JSON about myImage.jpg

Search:
* `http://mysite.com/page/search/train/?json` get JSON about the first page of search results about 'train'

The gallery itself:
* `http://mysite.com/?json` get JSON about the gallery itself and the top-level albums

## Pagination
By default, results are paginated in the normal Zenphoto pattern.  Get subsequent pages of results like this:
* `http://mysite.com/myAlbum/page/2/?json` get JSON about myAlbum and the second page of its immediate child albums
* `http://mysite.com/page/search/train/page/2/?json` get JSON about the second page of search results about 'train'

Use "`pagination=off`" to return the full unpaginated set of results.

Albums:
* `http://mysite.com/myAlbum/?json&pagination=off` get myAlbum and all its descendants, unpaginated

Search:
* `http://mysite.com/page/search/train/?json&pagination=off` get search results about 'train', unpaginated

The gallery itself:
* `http://mysite.com/?json&pagination=off` get info about the gallery itself and the top-level albums, unpaginated

`pagination` has no effect on images.

## Depth of album retrieval
Use the `depth` parameter to control the amount of information retrieved about descendant albums.  

Albums
* `http://mysite.com/myAlbum/?json&depth=0` get thumbnail info about myAlbum (no images, no subalbums)
* `http://mysite.com/myAlbum/?json&depth=1` get myAlbum and thumbnail info about its immediate subalbums
* `http://mysite.com/myAlbum/?json&depth=2` get myAlbum, its immediate subalbums, and thumbnail info about the subalbums' immediate subalbums
* `http://mysite.com/myAlbum/?json&depth=-1` get full information about myAlbum and **ALL** its descendants

The gallery itself:
* `http://mysite.com/?json&depth=0` get basic info about the gallery, but no albums
* `http://mysite.com/?json&depth=1` get thumbnail info about the top-level albums
* `http://mysite.com/?json&depth=2` get top level albums and thumbnail info about their children
* `http://mysite.com/?json&depth=-1` get **EVERY ALBUM IN THE SYSTEM**

If `depth` is omitted, it defaults to 1, meaning it returns thumbnail information about immediate child albums.

There is no maximum `depth`.  You can go as deep as you want.

Use `depth` carefully!  It can be very expensive to get a giant set of nested albums.  I can't call this on my *own* root gallery of about 1000 albums and 25000 images because it times out.

`depth` has no effect on images and searches.

## Statistics
If you have enabled the image_album_statistics plugin (it's included with Zenphoto), when you get your root gallery you can also retrieve various statistics about it.  Examples:
* `http://mysite.com/?json&latest-albums` get the latest album in your gallery
* `http://mysite.com/?json&latest-albums&latest-images` get the latest album and the latest image
* `http://mysite.com/?json&latest-albums=3` get the 3 latest albums
* `http://mysite.com/?json&latest-albums=3&latest-images=4` get the 3 latest albums and 4 latest images

Supports the following stats:
* Albums
  * popular-albums, latest-albums, latest-date-albums, latest-mtime-albums, latest-publishdate-albums, mostrated-albums, toprated-albums, latestupdated-albums, random-albums
* Images
  * popular-images, latest-images, latest-date-images, latest-mtime-images, latest-publishdate-images, mostrated-images, toprated-images, random-images

This currently only works for the top-level gallery.  It's a future enhancement to make it work for specific albums.

## Localization
If your Zenphoto is in multilingual mode, you can access language-specific content:
* Enable the official `seo_locale` plugin to allow switching the language via URL
* `http://mysite.com/<locale>/myAlbum/?json` now gets JSON about myAlbum in that locale, if any language-specific content exists.  Otherwise it gets content for the default language.
* Example: `http://mysite.com/de_DE/myAlbum/?json` would get the German content

This principle works with all the URLs above.

## Cross-domain AJAX
For security reasons it does not support AJAX requests from random domains. However, it does allow cross-domain AJAX from subdomains.   For example, you can have zenphoto on `mysite.com` and your web app on `app.mysite.com`.
