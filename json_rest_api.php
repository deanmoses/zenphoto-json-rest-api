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
$plugin_disable = (version_compare(PHP_VERSION, '5.4') >= 0) ? false : gettext_pl('zenphoto-json-rest-api requires PHP 5.4 or greater.', 'json_rest_api');
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
		global $_zp_gallery_page, $_zp_gallery, $_zp_current_album, $_zp_current_image, $_zp_current_search;

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

		// the data structure we will return via JSON
		$ret = array();

		if (GALLERY_SECURITY === 'public') {
			switch ($_zp_gallery_page) {
				case 'index.php':
					if ($_zp_current_album && !$_zp_current_album->exists) {
						$ret = self::getErrorData(404, gettext_pl('Album does not exist.', 'json_rest_api'));
					} else {
						$ret['gallery'] = self::getGalleryData($_zp_gallery, self::getDepth());
					}
					break;
				case 'album.php':
					if ($_zp_current_image && !$_zp_current_image->exists) {
						$ret = self::getErrorData(404, gettext_pl('Image does not exist.', 'json_rest_api'));
					} else {
						$ret['album'] = self::getAlbumData($_zp_current_album, self::getDepth());
						self::addStats($ret['album'], $_zp_current_album->getFolder());
					}
					break;
				case 'image.php':
					$ret['image'] = self::getImageData($_zp_current_image, true);
					break;
				case 'search.php':
					$ret['search'] = self::getSearchData($_zp_current_search);
					break;
			}
		} else {
			$ret = self::getErrorData(403, gettext_pl('Access forbidden.', 'json_rest_api'));
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
	static function getGalleryData($gallery, $depth = 1) {
		// the data structure we will be returning
		$ret = array();

		self::add($ret, $gallery, 'getTitle');
		self::add($ret, $gallery, 'getDesc');

		$ret['image_size'] = (int) getOption('image_size');
		$ret['thumb_size'] = (int) getOption('thumb_size');

		// $depth = 0 means stop, we don't want subalbums
		if ($depth !== 0) {
			// if $depth is -1 leave it at -1 (infinite subalbums).  Otherwise it's greater than zero, decrement it.
			$newDepth = ($depth < 0) ? $depth : $depth -1;

			// For each top-level album
		   	$subAlbumNames = $gallery->getAlbums(self::getCurrentPage());
			if (is_array($subAlbumNames)) {
				

				$albums = array();
				foreach ($subAlbumNames as $subAlbumName) {
					$subalbum = newAlbum($subAlbumName, $gallery);
					$albums[] = self::getAlbumData($subalbum, $newDepth);
				}
				if ($albums) {
					$ret['albums'] = $albums;
				}
			}
		}

		self::addStats($ret);
		
		return $ret;
	}

	/**
	 * Return array containing info about an album.
	 * 
	 * @param obj $album Album object
	 * @param int $depth the depth of subalbums to get.
	 *			 2: get this album, immediate subalbums, and thumbnails of the subalbum's immediate subalbums
	 *			 1: get this album and the thumbnails of subalbums (DEFAULT)
	 *			 0: get just the thumbnail information about this album (no images or albums)
	 *			-1: get all albums (infinite depth)
	 * @return JSON-ready array
	 */
	static function getAlbumData($album, $depth = 1) {
		global $_zp_current_image;

		if (!$album) {
			return;
		}

		if (!$album->checkAccess()) {
			return self::getErrorData(403, gettext_pl('Access forbidden.', 'json_rest_api'));
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

		// $depth = 0 means stop, we just want the thumb info for this album
		if ($depth !== 0) {
			// if $depth is -1 leave it at -1 (infinite subalbums).  Otherwise it's greater than zero, decrement it.
			$newDepth = ($depth < 0) ? $depth : $depth -1;

			// Add info about this albums' subalbums
			$albums = array();
			foreach ($album->getAlbums(self::getCurrentPage()) as $folder) {
				$subalbum = newAlbum($folder);
				$albums[] = self::getAlbumData($subalbum, $newDepth);
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
			$parentAlbum = self::getAlbumData($album->getParent(), 0 /*thumb only*/);
			if ($parentAlbum) {
				$ret['parent_album'] = $parentAlbum; // would like to use 'parent' but that's a reserved word in javascript
			}
			
			// Add info about next album
			$nextAlbum = self::getAlbumData($album->getNextAlbum(), 0 /*thumb only*/);
			if ($nextAlbum) {
				$ret['next'] = $nextAlbum;
			}
			
			// Add info about prev album
			$prevAlbum = self::getAlbumData($album->getPrevAlbum(), 0 /*thumb only*/);
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
		if (!$image) {
			return;
		}

		if (!$image->checkAccess()) {
			return self::getErrorData(403, gettext_pl('Access forbidden.', 'json_rest_api'));
		}

		// the data structure we will be returning
		$ret = array();

		$ret['path'] = $path = $image->getAlbumName() . '/' . $image->getFileName();
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
		if ($_zp_current_search->getNumImages() != 0) {
			$images = $_zp_current_search->getImages(self::getCurrentPage());
			foreach ($images as $image) {
				$imageIndex = $_zp_current_search->getImageIndex($image['folder'], $image['filename']);
				$imageObject = $_zp_current_search->getImage($imageIndex);
				$ret['images'][] = self::getImageData($imageObject);
			}
		}

		// add search results that are albums
		if ($_zp_current_search->getNumAlbums() != 0) {
			while (next_album()) {
				$ret['albums'][] = self::getAlbumData($_zp_current_album, 0 /* thumb only */);
			}
		}

		return $ret;
	}

	/**
	 * Return array with error information
	 * 
	 * @param string $error_message
	 * @return JSON-ready array
	 */
	static function getErrorData($errorcode, $error_message = '') {
		$ret = array();
		switch($errorcode) {
			case 403:
				http_response_code(403);
				$ret['status'] = 403;
				break;
			case 404:
				http_response_code(404);
				$ret['status'] = 404;
				break;
		}
		$ret['error'] = true;
		$ret['message'] = $error_message;
		return $ret;
	}

	/**
	 * Add all album and image stats requested on the query string.
	 *
	 * @param array $ret the array that will eventually be converted into JSON
	 * @param string $albumFolder optional name of an album to only get the stats for its direct subalbums
	 */
	static function addStats(&$ret, $albumFolder = null) {
		try {
			$albumStats = self::getAlbumStats($albumFolder);
			if ($albumStats) {
				$ret['stats']['album'] = $albumStats;
			}
			$imageStats = self::getImageStats($albumFolder);
			if ($imageStats) {
				$ret['stats']['image'] = $imageStats;
			}
		} catch(Exception $e) {
			$ret['stats']['error'] = $e->getMessage();
		}
	}

	/**
	 * Return every album stat requested on the query string.
	 *
	 * @param string $albumFolder optional name of an album to only get the stats for its direct subalbums
	 * @return JSON-ready array
	 */
	static function getAlbumStats($albumFolder = null) {
		// the data structure we will be returning
		$ret = array();

		foreach (self::$albumStatTypes as $statType) {
			$statTypeQueryParam = $statType . '-albums';
			if (isset($_GET[$statTypeQueryParam])) {
				if (!self::isStatsPluginEnabled()) {
					throw new Exception(gettext_pl('Plugin not enabled:  ', 'json_rest_api') . self::$statsPluginName);
				}

				$statParams = self::parseStatParameters($_GET[$statTypeQueryParam]);

				$ret[$statType] = self::getAlbumStatData($statType, $albumFolder,
					$statParams['count'],
					$statParams['threshold'],
					$statParams['sort'],
					$statParams['deep']);
			}
		}

		return $ret;
	}

	/**
	 * Return array of data for a single album stat.
	 *
	 * @param string $statType any of the album stat types defined in the stats plugin
	 * @param string $albumFolder optional name of an album to only get the stats for its direct subalbums
	 * @param int $count number of albums to return
	 * @param int threshold the minimum number of ratings (for rating options) or hits (for popular option) an album must have to be included in the list.
	 * @param string $sortdirection 'desc' or 'asc'
	 * @param boolean $deep true for statistics to include all subalbum levels
	 * @return JSON-ready array of albums
	 */
	static function getAlbumStatData($statType, $albumFolder = null, $count = 1, $threshold, $sortdirection, $deep) {
		// the data structure we will be returning
		$ret = array();

		if (!is_int($count)) {
			$count = intval($count);
		}

		if ($count < 1 || $count > 10) {
			$count = 1;
		}

		$albums = getAlbumStatistic($count, $statType, $albumFolder, $threshold, $sortdirection, $deep);
		if (is_array($albums)) {
			foreach($albums as $album) {
				$ret[] = self::getAlbumData($album, 0 /*thumb only*/);
			}
		}

		return $ret;
	}

	/**
	 * Return every image stat requested on the query string.
	 *
	 * @param string $albumFolder optional name of an album to get only the stats for its direct subalbums
	 * @return JSON-ready array of albums
	 */
	static function getImageStats($albumFolder = null) {
		// the data structure we will be returning
		$ret = array();

		foreach (self::$imageStatTypes as $statType) {
			$statTypeQueryParam = $statType . '-images';
			if (isset($_GET[$statTypeQueryParam])) {
				if (!self::isStatsPluginEnabled()) {
					throw new Exception(gettext_pl('Plugin not enabled:  ', 'json_rest_api') . self::$statsPluginName);
				}

				$statParams = self::parseStatParameters($_GET[$statTypeQueryParam]);

				$ret[$statType] = self::getImageStatData($statType, $albumFolder,
					$statParams['count'],
					$statParams['threshold'],
					$statParams['sort'],
					$statParams['deep']);
			}
		}

		return $ret;
	}

	/**
	 * Return array of data for a single image stat.
	 *
	 * @param string $statType any of the image stat types defined in the image_album_statistics plugin
	 * @param string $albumFolder optional name of an album to get only the stats for its direct subalbums
	 * @param int $count number of images to return
	 * @param int threshold the minimum number of ratings (for rating options) or hits (for popular option) an image must have to be included in the list.
	 * @param string $sortdirection 'desc' or 'asc'
	 * @param boolean $deep true for statistics to include all subalbum levels
	 * @return JSON-ready array of images
	 */
	static function getImageStatData($statType, $albumFolder = null, $count = 1, $threshold, $sortdirection, $deep) {
		// the data structure we will be returning
		$ret = array();

		if (!is_int($count)) {
			$count = intval($count);
		}

		if ($count < 1 || $count > 10) {
			$count = 1;
		}

		$images = getImageStatistic($count, $statType, $albumFolder, $deep, $threshold, $sortdirection);
		if (is_array($images)) {
			foreach($images as $image) {
				$ret[] = self::getImageData($image);
			}
		}
		return $ret;
	}

	/**
	 * Return true/false whether the stats plugin is enabled.  
	 *
	 * Additionally, if this is the FIRST time this method is called, 
	 * require_once() the stats plugin to make its functions available.
	 *
	 * @return boolean
	 */
	static function isStatsPluginEnabled() {
		if (self::$statsPluginEnabled === null) {
			self::$statsPluginEnabled = extensionEnabled(self::$statsPluginName);
			if (self::$statsPluginEnabled) {
				require_once(SERVERPATH . '/' . ZENFOLDER . '/' . PLUGIN_FOLDER . '/' . self::$statsPluginName . '.php');
			}
		}
		return self::$statsPluginEnabled;
	}

	/**
	 * Parse the parameters for a single stat on the query string, like
	 * latest_albums=count:4,threshold:2,sort:asc,deep:true
	 *
	 * @param string $statParam like 'count:4,threshold:2,sort:asc,deep:true'
	 * @return array of parsed stat parameters
	 */
	static function parseStatParameters($statParams) {
		// data structure to return
		$parsedParams = array();

		if ($statParams) {
			// split something like 'count:4,threshold:2,sort:asc,deep' into individual parameters like 'count:4'
			$params = explode(',', $statParams);
			// split each individual parameter like 'count:4' into a name value pair
			foreach ($params as $param) {
				$pair = explode(':', $param);
				if (count($pair) < 2) {
					self::throw_qs('stat parameter is missing a colon', $param);
				}
				else if (count($pair) > 2) {
					self::throw_qs('stat parameter has too many colons', $param);
				}

				$name = strtolower(trim($pair[0]));
				$value = strtolower(trim($pair[1]));

				if ($name === 'count') {
					if (!is_numeric($value)) {
						self::throw_qs('stat parameter "count" is not numeric', $param);
					}
					$parsedParams['count'] = sanitize_numeric($value);
				}
				else if ($name === 'threshold') {
					if (!is_numeric($value)) {
						self::throw_qs('stat parameter "threshold" is not numeric', $param);
					}
					$parsedParams['threshold'] = sanitize_numeric($value);
				}
				else if ($name === 'sort') {
					$parsedParams['sort'] = sanitize($value);
					if (!in_array($parsedParams['sort'], array('asc','desc'))) {
						self::throw_qs('stat parameter is not "asc" or "desc"', $param);
					}
				}
				else if ($name === 'deep') {
					$parsedParams['deep'] = sanitize($value);
					if (!in_array($parsedParams['deep'], array('true','false'))) {
						self::throw_qs('stat parameter is not "true" or "false"', $param);
					}
				}
				else {
					self::throw_qs('unrecognized stat parameter', $name);
				}
			}
		}

		// Ensure there's a default value for each key.  Otherwise we get a PHP warning when accessed.
		if (!isset($parsedParams['count'])) $parsedParams['count'] = null;
		if (!isset($parsedParams['threshold'])) $parsedParams['threshold'] = null;
		if (!isset($parsedParams['sort'])) $parsedParams['sort'] = null;
		if (!isset($parsedParams['deep'])) $parsedParams['deep'] = false;

		return $parsedParams;
	}

	/**
	 * Throw a localized error message about the query string format
	 *
	 * @param string $message to be localized
	 * @param string $param to be appended after localized message.
	 */
	static function throw_qs($message, $param) {
		$msgStart = gettext_pl('Invalid query string', 'json_rest_api');
		$msgBody = gettext_pl($message, 'json_rest_api');
		throw new Exception("$msgStart: $msgBody: \"$param\"");
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

	/**
	 * Get the value of the depth query string parameter, or the default depth.
	 * @return integer
	 */
	static function getDepth() {
		return (isset($_GET['depth']))
			? intval(sanitize_numeric($_GET['depth']))
			: 1; // default depth.  Means get the album + thumbs of immediate subalbums
	}
}
?>
