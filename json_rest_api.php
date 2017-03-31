<?php

/**
 * A JSON REST API for ZenPhoto.
 *
 * This filter looks for a query string parameter '?json' and
 * returns a JSON representation of the album or search results
 * instead of the normal HTML response.
 *
 * @author Dean Moses (deanmoses)
 * @package plugins
 * @subpackage development
 */
$plugin_is_filter = 900 | FEATURE_PLUGIN;
$plugin_description = gettext('JSON REST API for Zenphoto');
$plugin_author = "Dean Moses (deanmoses)";
$plugin_version = '0.2.0';
$plugin_URL = 'https://github.com/deanmoses/zenphoto-json-rest-api';

// Handle REST API calls before anything else
// This is necessary because it sets response headers that are different from Zenphoto's normal ones  
if (!OFFSET_PATH && isset($_GET['json'])) {
	zp_register_filter('load_theme_script', 'rest_api_execute', 9999);
}

/**
 * Respond to the request with JSON rather than the normal HTML
 */
function rest_api_execute() {
	global $_zp_gallery, $_zp_current_album, $_zp_current_image, $_zp_current_search;

	header('Content-type: application/json; charset=UTF-8');

	// If the request is coming from a subdomain, send the headers
	// that allow cross domain AJAX.  This is important when the web 
	// front end is being served from sub.domain.com, but its AJAX
	// requests are hitting this zenphoto installation on domain.com

	// Browsers send the Origin header only when making an AJAX request
	// to a different domain than the page was served from.  Format: 
	// protocol://hostname that the web app was served from.  In most 
	// cases it'll be a subdomain like http://cdn.zenphoto.com
    if (isset($_SERVER['HTTP_ORIGIN'])) {
    	// The Host header is the hostname the browser thinks it's 
    	// sending the AJAX request to. In most casts it'll be the root 
    	// domain like zenphoto.com

    	// If the Host is a substring within Origin, Origin is most likely a subdomain
    	// Todo: implement a proper 'endsWith'
        if (strpos($_SERVER['HTTP_ORIGIN'], $_SERVER['HTTP_HOST']) !== false) {
        	// Allow CORS requests from the subdomain the ajax request is coming from
        	header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");

        	// Allow credentials to be sent in CORS requests. 
        	// Really only needed on requests requiring authentication
        	header('Access-Control-Allow-Credentials: true');
        }
    }

    // Add a Vary header so that browsers and CDNs know they need to cache different
	// copies of the response when browsers send different Origin headers.  
	// This allows us to have clients on foo.zenphoto.com and bar.zenphoto.com, 
	// and the CDN will cache different copies of the response for each of them, 
	// with the appropriate Access-Control-Allow-Origin header set.
	header('Vary: Origin', false /* Allow for multiple Vary headers because other things could be adding a Vary as well. */);

	$_zp_gallery_page = 'json_rest_api.php';

	// the data structure we will return via JSON
	$ret = array();
	
	// If system is in the context of a search
	if ($_zp_current_search) {
		$ret['search'] = rest_api_search($_zp_current_search);
	}
	// Else if system is in the context of an image
	else if ($_zp_current_image) {
		if (!$_zp_current_image->exists) {
			$ret = rest_api_404("Image does not exist.");
		}
		else {
			$ret['image'] = rest_api_image($_zp_current_image);
		}
	}
	// Else if system is in the context of an album
	else if ($_zp_current_album) {
		if (!$_zp_current_album->exists) {
			$ret = rest_api_404("Album does not exist.");
		}
		else {
			$ret['album'] = rest_api_album($_zp_current_album);
		}
	}
	// Else there's no current search, image or album
	// Return info about the root albums of the site
	else {
		$ret['gallery'] = rest_api_gallery($_zp_gallery);
	}
	
	// Return the results to the client in JSON format
	print(json_encode($ret));
	exitZP();
}

/**
 * Return array containing the root albums of the gallery.
 * 
 * @param Gallery $gallery
 * @return JSON-ready array
 */
function rest_api_gallery($gallery) {
	// the data structure we will be returning
	$ret = array();

	if ($gallery->getTitle()) $ret['title'] = $gallery->getTitle();
	if ($gallery->getDesc()) $ret['description'] = $gallery->getDesc();

	$ret['image_size'] = (int) getOption('image_size');
	$ret['thumb_size'] = (int) getOption('thumb_size');

	// Get the top-level albums
   	$subAlbumNames = $gallery->getAlbums();
	if (is_array($subAlbumNames)) {
		$albums = array();
		foreach ($subAlbumNames as $subAlbumName) {
			$subalbum = new Album($subAlbumName, $gallery);

			// If the client asked for a deep tree, return all subalbums and descendants
			if ($_GET['json'] === 'deep') {
				$albums[] = rest_api_album($subalbum);
			}
			// Else return shallow: just the thumbnail info of immediate child albums
			else {
				$albums[] = rest_api_album_thumb($subalbum);
			}
		}
		if ($albums) {
			$ret['albums'] = $albums;
		}
	}

	return $ret;
}

/**
 * Return array containing full album.
 * 
 * @param Album $album
 * @return JSON-ready array
 */
function rest_api_album($album) {
	global $_zp_current_image;

	// the data structure we will be returning
	$ret = array();

	$ret['path'] = $album->name;
	
	$ret['date'] = rest_api_timestamp($album->getDateTime());
	if ($album->getTitle()) $ret['title'] = $album->getTitle();
	if ($album->getDesc()) $ret['description'] = $album->getDesc();
	if ($album->getCustomData()) $ret['custom_data'] = $album->getCustomData();
	if (!(boolean) $album->getShow()) $ret['unpublished'] = true;
	$ret['image_size'] = (int) getOption('image_size');
	$ret['thumb_size'] = (int) getOption('thumb_size');
	
	$thumb_path = $album->get('thumb');
	if (!is_numeric($thumb_path)) {
		$ret['thumb'] = $thumb_path;
	}

	$thumbImage = $album->getAlbumThumbImage();
	if ($thumbImage) {
		$ret['url_thumb'] = $album->getAlbumThumbImage()->getThumb();
	}
	
	// Add info about this albums' subalbums
	$albums = array();
	foreach ($album->getAlbums() as $folder) {
		$subalbum = newAlbum($folder);
		// If the client asked for a deep tree, return all subalbums and descendants
		if ($_GET['json'] === 'deep') {
			$albums[] = rest_api_album($subalbum);
		}
		// Else return shallow: just the thumbnail info of immediate child albums
		else {
			$albums[] = rest_api_album_thumb($subalbum);
		}
	}
	if ($albums) {
		$ret['albums'] = $albums;
	}

	// Add info about this albums' images
	$images = array();
	foreach ($album->getImages() as $filename) {
		$image = newImage($album, $filename);
		$images[] = rest_api_image($image);
	}
	if ($images) {
		$ret['images'] = $images;
	}
	
	// Add info about parent album
	$parentAlbum = rest_api_related_album($album->getParent());
	if ($parentAlbum) {
		$ret['parent_album'] = $parentAlbum; // would like to use 'parent' but that's a reserved word in javascript
	}
	
	// Add info about next album
	$nextAlbum = rest_api_related_album($album->getNextAlbum());
	if ($nextAlbum) {
		$ret['next'] = $nextAlbum;
	}
	
	// Add info about prev album
	$prevAlbum = rest_api_related_album($album->getPrevAlbum());
	if ($prevAlbum) {
		$ret['prev'] = $prevAlbum;
	}

	return $ret;
}

/**
 * Return array containing just enough info about a parent / prev / next album to navigate to it.
 * 
 * @param Album $album
 * @return JSON-ready array
 */
function rest_api_related_album($album) {
	if ($album) {
		$ret = array();
		$ret['path'] = $album->name;
		$ret['date'] = rest_api_timestamp($album->getDateTime());
		if ($album->getTitle()) $ret['title'] = $album->getTitle();
		return $ret;
	}
	return;
}

/**
 * Return array containing just enough info about an album to render its thumbnail.
 * 
 * @param Album $album
 * @return JSON-ready array
 */
function rest_api_album_thumb($album) {
	$ret = array();
	$ret['path'] = $album->name;
	$ret['date'] = rest_api_timestamp($album->getDateTime());
	if ($album->getTitle()) $ret['title'] = $album->getTitle();
	if ($album->getCustomData()) $ret['custom_data'] = $album->getCustomData();
	if (!(boolean) $album->getShow()) $ret['unpublished'] = true;
	$thumbImage = $album->getAlbumThumbImage();
	if ($thumbImage) {
		$ret['url_thumb'] = $album->getAlbumThumbImage()->getThumb();
	}
	
	return $ret;
}

/**
 * Return array containing just enough info about an image to render it on a standalone page.
 * 
 * @param Album $album
 * @return JSON-ready array
 */
function rest_api_image($image) {
	$ret = array();
	// strip /zenphoto/albums/ so that the path starts something like myAlbum/...
	$ret['path'] = str_replace(ALBUMFOLDER, '', $image->getFullImage());
	$ret['date'] = rest_api_timestamp($image->getDateTime());
	if ($image->getTitle()) $ret['title'] = $image->getTitle();
	if ($image->getDesc()) $ret['description'] = $image->getDesc();
	$ret['url_full'] = $image->getFullImageURL();
	$ret['url_sized'] = $image->getSizedImage(getOption('image_size'));
	$ret['url_thumb'] = $image->getThumb();
	$ret['width'] = (int) $image->getWidth();
	$ret['height'] = (int) $image->getHeight();
	return $ret;
}

/**
 * Return array containing search results.  Uses the SearchEngine defined in $_zp_current_search.
 * 
 * @return JSON-ready array
 */
function rest_api_search() {
	global $_zp_current_album, $_zp_current_image, $_zp_current_search;

	// the data structure we will be returning
	$ret = array();

	$ret['thumb_size'] = (int) getOption('thumb_size');
	
	$_zp_current_search->setSortType('date');
	$_zp_current_search->setSortDirection('DESC');
	
	// add search results that are images
	$imageResults = array();
	$images = $_zp_current_search->getImages();
	foreach ($images as $image) {
		$imageIndex = $_zp_current_search->getImageIndex($image['folder'], $image['filename']);
		$imageObject = $_zp_current_search->getImage($imageIndex);
		$imageResults[] = rest_api_image($imageObject);
	}
	if ($imageResults) {
		$ret['images'] = $imageResults;
	}
	
	// add search results that are albums
	$albumResults = array();
	while (next_album()) {
		$albumResults[] = rest_api_album_thumb($_zp_current_album);
	}
	if ($albumResults) {
		$ret['albums'] = $albumResults;
	}

	return $ret;
}

/**
 * Return array with 404 Not Found information
 * 
 * @param string $error_message
 * @return JSON-ready array
 */
function rest_api_404($error_message) {
	http_response_code(404);
	$ret = array();
	$ret['error'] = true;
	$ret['status'] = 404;
	$ret['message'] = $error_message;
	return $ret;
}

/**
 * Take a zenphoto date string and turn it into an integer timestamp of 
 * seconds since the epoch.  Javascript uses milliseconds since the 
 * epoch so javascript clients will neeed to multiply times 1000, like:
 * new Date(1000*timestamp)
 *
 * @param string $dateString
 * @return integer
 */
function rest_api_timestamp($dateString) {
	$a = strptime($dateString, '%Y-%m-%d %H:%M:%S'); //format:  2014-11-24 01:40:22
	return (int) mktime($a['tm_hour'], $a['tm_min'], $a['tm_sec'], $a['tm_mon']+1, $a['tm_mday'], $a['tm_year']+1900);
}

?>