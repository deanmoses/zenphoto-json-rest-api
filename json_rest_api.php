<?php

/**
 * A JSON REST API for ZenPhoto.
 *
 * Looks for a query string parameter '?json' and returns a JSON representation 
 * of the album or search results instead of the normal HTML response.
 *
 * @author Dean Moses (deanmoses)
 * @package plugins
 * @subpackage development
 */
$plugin_is_filter = 900 | FEATURE_PLUGIN;
$plugin_description = gettext_pl('JSON REST API for Zenphoto', 'json_rest_api');
$plugin_author = 'Dean Moses (deanmoses)';
$plugin_version = '0.3.0';
$plugin_URL = 'https://github.com/deanmoses/zenphoto-json-rest-api';

// Handle REST API calls before anything else
// This is necessary because it sets response headers that are different from Zenphoto's normal ones  
if (!OFFSET_PATH && isset($_GET['json'])) {
	zp_register_filter('load_theme_script', 'jsonRestApi::execute', 9999);
}

class jsonRestApi {

	/**
	 * Name of the stats plugin
	 */
	static $statsPluginName = 'image_album_statistics';

	/**
	 * Whether the stats plugin is enabled.  Boolean.  Null means value hasn't been determined yet.
	 */
	static $statsPluginEnabled = null;

	/**
	 * The types of album stats available in the stats plugin.
	 */
	static $albumStatTypes = ['popular', 'latest', 'latest-date', 'latest-mtime', 'latest-publishdate', 'mostrated', 'toprated', 'latestupdated', 'random'];

	/**
	 * The types of image stats available in the stats plugin.
	 */
	static $imageStatTypes = ['popular', 'latest', 'latest-date', 'latest-mtime', 'latest-publishdate', 'mostrated', 'toprated', 'random'];

	/**
	 * Respond to the request with JSON rather than the normal HTML.
	 *
	 * This does not return; it exits Zenphoto.
	 */
	static function execute() {
		global $_zp_gallery, $_zp_current_album, $_zp_current_image, $_zp_current_search;

		header('Content-type: application/json; charset=UTF-8');

		// If the request is coming from a subdomain, send the headers
		// that allow cross domain AJAX.  This is important when the web 
		// front end is being served from sub.domain.com but its AJAX
		// requests are hitting a zenphoto installation on domain.com

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
			$ret['search'] = self::getSearchData($_zp_current_search);
		}
		// Else if system is in the context of an image
		else if ($_zp_current_image) {
			if (!$_zp_current_image->exists) {
				$ret = self::get404Data(gettext_pl('Image does not exist.', 'json_rest_api'));
			}
			else {
				$ret['image'] = self::getImageData($_zp_current_image, true /* return more image info */);
			}
		}
		// Else if system is in the context of an album
		else if ($_zp_current_album) {
			if (!$_zp_current_album->exists) {
				$ret = self::get404Data(gettext_pl('Album does not exist.', 'json_rest_api'));
			}
			else {
				$ret['album'] = self::getAlbumData($_zp_current_album);
			}
		}
		// Else there's no current search, image or album
		// Return info about the root albums of the site
		else {
			$ret['gallery'] = self::getGalleryData($_zp_gallery);
		}
		
		// Return the results to the client in JSON format
		print(json_encode($ret));
		exitZP();
	}

	/**
	 * Return array containing info about the gallery itself and its root albums.
	 * 
	 * @param obj $gallery Gallery object
	 * @return JSON-ready array
	 */
	static function getGalleryData($gallery) {
		// the data structure we will be returning
		$ret = array();

		self::add($ret, $gallery, 'getTitle');
		self::add($ret, $gallery, 'getDesc');

		$ret['image_size'] = (int) getOption('image_size');
		$ret['thumb_size'] = (int) getOption('thumb_size');

		// For each top-level album
	   	$subAlbumNames = $gallery->getAlbums(self::getCurrentPage());
		if (is_array($subAlbumNames)) {
			// json=deep means get all descendant albums
			$shallow = $_GET['json'] !== 'deep';

			$albums = array();
			foreach ($subAlbumNames as $subAlbumName) {
				$subalbum = newAlbum($subAlbumName, $gallery);
				$albums[] = self::getAlbumData($subalbum, $shallow);
			}
			if ($albums) {
				$ret['albums'] = $albums;
			}
		}

		self::addAlbumStats($ret);
		self::addImageStats($ret);
		
		return $ret;
	}

	/**
	 * Return array containing info about an album.
	 * 
	 * @param obj $album Album object
	 * @param boolean $thumbOnly true: only return enough info to render this album's thumbnail
	 * @return JSON-ready array
	 */
	static function getAlbumData($album, $thumbOnly = false) {
		global $_zp_current_image;

		if (!$album) {
			return;
		}

		// the data structure we will be returning
		$ret = array();

		$ret['path'] = $album->name;
		self::add($ret, $album, 'getTitle');
		self::add($ret, $album, 'getDesc');
		$ret['date'] = self::dateToTimestamp($album->getDateTime());
		$date_updated = self::dateToTimestamp($album->getUpdatedDate());
		// I'm getting negative updatedDate on albums that don't have any direct child images
		if ($date_updated && $date_updated > 0) {
			$ret['date_updated'] = self::dateToTimestamp($album->getUpdatedDate());
		}
		self::add($ret, $album, 'getCustomData');
		if (!(boolean) $album->getShow()) $ret['unpublished'] = true;
		$ret['image_size'] = (int) getOption('image_size');
		$ret['thumb_size'] = (int) getOption('thumb_size');
		
		$thumbImage = $album->getAlbumThumbImage();
		if ($thumbImage) {
			$ret['url_thumb'] = $thumbImage->getThumb();
		}

		if (!$thumbOnly) {
			// json=deep means get all descendant albums
			$shallow = $_GET['json'] !== 'deep';

			// Add info about this albums' subalbums
			$albums = array();
			foreach ($album->getAlbums(self::getCurrentPage()) as $folder) {
				$subalbum = newAlbum($folder);
				$albums[] = self::getAlbumData($subalbum, $shallow);
			}
			if ($albums) {
				$ret['albums'] = $albums;
			}

			// Add info about this albums' images
			$images = array();
			foreach ($album->getImages(self::getCurrentPage()) as $filename) {
				$image = newImage($album, $filename);
				$images[] = self::getImageData($image);
			}
			if ($images) {
				$ret['images'] = $images;
			}
			
			// Add info about parent album
			$parentAlbum = self::getAlbumData($album->getParent(), true /*thumb only*/);
			if ($parentAlbum) {
				$ret['parent_album'] = $parentAlbum; // would like to use 'parent' but that's a reserved word in javascript
			}
			
			// Add info about next album
			$nextAlbum = self::getAlbumData($album->getNextAlbum(), true /*thumb only*/);
			if ($nextAlbum) {
				$ret['next'] = $nextAlbum;
			}
			
			// Add info about prev album
			$prevAlbum = self::getAlbumData($album->getPrevAlbum(), true /*thumb only*/);
			if ($prevAlbum) {
				$ret['prev'] = $prevAlbum;
			}
		}

		return $ret;
	}

	/**
	 * Return array containing info about an image.
	 * 
	 * @param obj $image Image object
	 * @param boolean $verbose true: return a larger set of the image's information
	 * @return JSON-ready array
	 */
	static function getImageData($image, $verbose = false) {
		$ret = array();
		// strip /zenphoto/albums/ so that the image path starts something like myAlbum/...
		$ret['path'] = str_replace(ALBUMFOLDER, '', $image->getFullImage());
		self::add($ret, $image, 'getTitle');
		self::add($ret, $image, 'getDesc');
		$ret['date'] = self::dateToTimestamp($image->getDateTime());
		$ret['url_full'] = $image->getFullImageURL();
		$ret['url_sized'] = $image->getSizedImage(getOption('image_size'));
		$ret['url_thumb'] = $image->getThumb();
		$ret['width'] = (int) $image->getWidth();
		$ret['height'] = (int) $image->getHeight();
		$ret['index'] = (int) $image->getIndex();
		self::add($ret, $image, 'getCredit');
		self::add($ret, $image, 'getCopyright');

		if ($verbose) {
			self::add($ret, $image, 'getLocation');
			self::add($ret, $image, 'getCity');
			self::add($ret, $image, 'getState');
			self::add($ret, $image, 'getCountry');
			self::add($ret, $image, 'getCredit');
			self::add($ret, $image, 'getTags');
			self::add($ret, $image, 'getMetadata');
		}
		
		return $ret;
	}

	/**
	 * Return array containing info about search results.  
	 * Uses the SearchEngine defined in $_zp_current_search.
	 * 
	 * @return JSON-ready array
	 */
	static function getSearchData() {
		global $_zp_current_album, $_zp_current_image, $_zp_current_search;

		// the data structure we will be returning
		$ret = array();

		$ret['thumb_size'] = (int) getOption('thumb_size');
		
		$_zp_current_search->setSortType('date');
		$_zp_current_search->setSortDirection('DESC');
		
		// add search results that are images
		$imageResults = array();
		$images = $_zp_current_search->getImages(self::getCurrentPage());
		foreach ($images as $image) {
			$imageIndex = $_zp_current_search->getImageIndex($image['folder'], $image['filename']);
			$imageObject = $_zp_current_search->getImage($imageIndex);
			$imageResults[] = self::getImageData($imageObject);
		}
		if ($imageResults) {
			$ret['images'] = $imageResults;
		}
		
		// add search results that are albums
		$albumResults = array();
		while (next_album()) {
			$albumResults[] = self::getAlbumData($_zp_current_album, true /* thumb only */);
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
	static function get404Data($error_message) {
		http_response_code(404);
		$ret = array();
		$ret['error'] = true;
		$ret['status'] = 404;
		$ret['message'] = $error_message;
		return $ret;
	}

	/**
	 * Add every album stat requested on the query string into $ret.
	 *
	 * @param array $ret the global data structure that will be turned into the JSON response
	 * @param string $albumFolder optional name of an album to get only the stats for its direct subalbums
	 */
	static function addAlbumStats(&$ret, $albumFolder = null) {
		foreach (self::$albumStatTypes as $statType) {
			$statTypeQueryParam = $statType . '-albums';
			// The order of isset(GET) and isStatsPluginEnabled is important: 
			// isStatsPluginEnabled may write an error message into $ret and
			// we only want it to be written if at least one stat was actually
			// requested.
			if (isset($_GET[$statTypeQueryParam]) && self::isStatsPluginEnabled($ret)) {
				$count = $_GET[$statTypeQueryParam];
				$ret['stats']['album'][$statType] = self::getAlbumStatData($statType, $count, $albumFolder);
			}
		}
	}

	/**
	 * Return array of data for a single album stat.
	 *
	 * @param string $statType any of the album stat types defined in the stats plugin
	 * @param int $count number of albums to return
	 * @return JSON-ready array of albums
	 */
	static function getAlbumStatData($statType, $count) {
		// the data structure we will be returning
		$ret = array();

		if (!ctype_digit($count) || $count > 100) {
			$count = 1;
		}

		$albums = getAlbumStatistic($count, $statType);
		if (is_array($albums)) {
			foreach($albums as $album) {
				$ret[] = self::getAlbumData($album, true /*thumb only*/);
			}
		}

		return $ret;
	}

	/**
	 * Add every image stat requested on the query string to $ret.
	 *
	 * @param array $ret the global data structure that will be turned into the JSON response
	 * @param string $albumFolder optional name of an album to get only the stats for its direct subalbums
	 */
	static function addImageStats(&$ret, $albumFolder = null) {
		foreach (self::$imageStatTypes as $statType) {
			$statTypeQueryParam = $statType . '-images';
			// The order of isset(GET) and isStatsPluginEnabled is important: 
			// isStatsPluginEnabled may write an error message into $ret and
			// we only want it to be written if at least one stat was actually
			// requested.
			if (isset($_GET[$statTypeQueryParam]) && self::isStatsPluginEnabled($ret)) {
				$count = $_GET[$statTypeQueryParam];
				$ret['image_stats'][$statType] = self::getImageStatData($statType, $count, $albumFolder);
			}
		}
	}

	/**
	 * Return array of data for a single image stat.
	 *
	 * @param string $statType any of the image stat types defined in the image_album_statistics plugin
	 * @param int $count number of images to return
	 * @return JSON-ready array of images
	 */
	static function getImageStatData($statType, $count) {
		// the data structure we will be returning
		$ret = array();

		if (!ctype_digit($count) || $count > 100) {
			$count = 1;
		}

		$images = getImageStatistic($count, $statType);
		if (is_array($images)) {
			foreach($images as $image) {
				$ret[] = self::getImageData($image);
			}
		}
		return $ret;
	}

	/**
	 * Return whether the stats plugin is enabled.  If not, add error message to $ret.
	 *
	 * @param array $ret the main JSON-ready array
	 * @return boolean
	 */
	static function isStatsPluginEnabled(&$ret) {
		if (self::$statsPluginEnabled === null) {
			self::$statsPluginEnabled = extensionEnabled(self::$statsPluginName);
			if (!self::$statsPluginEnabled) {
				$errorMessage = gettext_pl('Plugin not enabled:  ', 'json_rest_api') . self::$statsPluginName;
				$ret['stats']['error'] = $errorMessage;
			}
			else {
				require_once(SERVERPATH . '/' . ZENFOLDER . '/' . PLUGIN_FOLDER . '/' . self::$statsPluginName . '.php');
			}
		}
		return self::$statsPluginEnabled;
	}

	/**
	 * Get the page number of paginated results.
	 *
	 * @return integer page number.  0 if results should not be paginated
	 */
	static function getCurrentPage() {
		global $_zp_page;
		// pagination=off means return 0, which tells Zenphoto to get all images and subalbums
		return isset($_GET['pagination']) && $_GET['pagination'] === 'off' ? 0 : $_zp_page;
	}

	/**
	 * Invoke the specified obj->methodName and add it to the $ret array.
	 * Does not add it if the method returns null or blank.
	 * Lowercases the method name and strips off any 'get':  getCopyright becomes copyright.
	 * 
	 * @param array $ret the array that will eventually be converted into JSON
	 * @param obj $obj instance of an object to invoke the method on
	 * @param string $methodName name of method, like getCopyright
	 */
	static function add(&$ret, $obj, $methodName) {
		$jsonName = strtolower(str_replace('get', '', $methodName));
		if ($obj->{$methodName}()) {
			$ret[$jsonName] = $obj->{$methodName}();
		}
	}

	/**
	 * Take a zenphoto date string and turn it into an integer timestamp of 
	 * seconds since the epoch.  
	 *
	 * Javascript uses milliseconds since the  epoch so javascript clients 
	 * will neeed to multiply times 1000, like: new Date(1000*timestamp)
	 *
	 * @param string $dateString
	 * @return integer
	 */
	static function dateToTimestamp($dateString) {
		$a = strptime($dateString, '%Y-%m-%d %H:%M:%S'); //format:  2014-11-24 01:40:22
		return (int) mktime($a['tm_hour'], $a['tm_min'], $a['tm_sec'], $a['tm_mon']+1, $a['tm_mday'], $a['tm_year']+1900);
	}
}
?>