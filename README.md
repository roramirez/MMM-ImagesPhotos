# MMM-ImagesPhotos
This is a module for the [MagicMirror](https://github.com/MichMich/MagicMirror). It will show photos from a directory.

This module reads the images from the *uploads* directory inside the module.
**Directory**: *MagicMirror/modules/MMM-ImagesPhotos/uploads*


## Installation
1. Clone this repository inside your MagicMirror's `modules` folder

   `cd ~/MagicMirror/modules`

   `git clone https://github.com/roramirez/MMM-ImagesPhotos.git`.

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
| `maxWidth`         | Value for maximum width. Optional, possible values: absolute (e.g. "700px") or relative ("50%") <br> Default 100%
| `maxHeight`        | Value for maximum height. Optional, possible values: absolute (e.g. "400px") or relative ("70%") <br> Default 100%


Here is an example of an entry in `config.js`
```
{
	module: "MMM-ImagesPhotos",
	position: "middle_center",
	config: {
		opacity: 0.9,
		animationSpeed: 500,
		updateInterval: 5000,
	}
},
```
