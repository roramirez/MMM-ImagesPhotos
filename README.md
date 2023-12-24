# MMM-ImagesPhotos
This is a module for the [MagicMirror](https://github.com/MichMich/MagicMirror). It will show photos from a directory.

This module reads the images from the *uploads* directory inside the module.
**Directory**: *MagicMirror/modules/MMM-ImagesPhotos/uploads*


## Installation
1. Clone this repository inside your MagicMirror's `modules` folder

   `cd ~/MagicMirror/modules`

   `git clone https://github.com/sdetweil/MMM-ImagesPhotos.git`

   `cd MMM-ImagesPhotos`

   `npm install`

## How it looks
![Demo](.github/animate.gif)

## Config
The entry in `config.js` can include the following options:


| Option             | Description
|--------------------|-----------
| `opacity`          | The opacity of the image.<br><br>**Type:** `double`<br>Default 0.9
| `animationSpeed`   | How long the fade out and fade in of photos should take.<br><br>**Type:** `int`<br>Default 500
| `updateInterval`   | How long before loading a new image.<br><br>**Type:** `int`(milliseconds) <br>Default 5000 milliseconds
| `getInterval`      | Interval value to get new images from directory.<br><br>**Type:** `int`(milliseconds) <br>Default 60000 milliseconds
| `sequential`       | true or false, whether to process the images randomly(default) or sequentially<br>Default false
| only when position is `NOT` fullscreen_below or fullscreen_above|
| `maxWidth`         | Value for maximum width. Optional, possible values: absolute (e.g. "700px") or relative ("50%") <br> Default 100%
| `maxHeight`        | Value for maximum height. Optional, possible values: absolute (e.g. "400px") or relative ("70%") <br> Default 100%
|only when position `IS` fullscreen_below or fullscreen_above 
| `backgroundColor`  | Value for color used to fill around the image if not fullscreen,  can be #xxyyzz, like #808080 (grey),<br> if fill is true, the backgroundColor setting is ignored<br>Default 'black'
| `fill`             | true or false,  instead of color use a blurred copy of the image to fill around the image, <br>Default false.
| `blur`             | the size of the pixel blur of the background fill, <br>Default 8


Here is an example of an entry in `config.js`
```
{
	module: "MMM-ImagesPhotos",
	position: "fullscreen_below",
	config: {
		opacity: 0.9,
		animationSpeed: 500,
		updateInterval: 5000,
		backgroundColor: 'grey',  // not used if fill is true
		fill: false,   // fill around image with blurred copy of image
		blur: 10,   // only used if fill is true
		sequential: false  // process the image list randomly
	}
},
```
