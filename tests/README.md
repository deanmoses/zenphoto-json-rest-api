Tests for Zenphoto JSON REST API
=================================

These tests run on Node.js.

## Setup to run the tests
1.  Install Node.js
1.  Install Zenphoto
1.  Get this project from GitHub
1.  Install the REST API plugin into Zenphoto. You can copy or symlink it.
1.  Enable the album_image_statistics plugin.
1.  Set up the test data
    1. Make `tests/testdata/albums` the Zenphoto albums directory. It must *replace* the root album folder. You can copy or symlink it.
    1. From the Zenphoto admin console, unpublish the album 'unpublished_album'
    1. From the Zenphoto admin console, unpublish the image 'unpublished_image/unpublished.jpg'
1.  Then:
```
cd [PROJECT ROOT]/tests
npm install # installs all the Node.js dependencies for the tests
```
## Run the tests
```
cd [PROJECT ROOT]/tests
npm test
```
The test success/failure messages will display in the terminal.
