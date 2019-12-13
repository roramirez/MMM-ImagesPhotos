/* Magic Mirror
 * Node Helper: MMM-ImagesPhotos
 *
 * By Rodrigo Ramìrez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */

var express = require("express");
var NodeHelper = require("node_helper");
var request = require("request");
var url = require("url");
var path = require("path");
var fs = require("fs");
var mime = require("mime-types");

module.exports = NodeHelper.create({
	// Override start method.
	start: function() {
		var self = this;
		console.log("Starting node helper for: " + this.name);
	},

	setConfig: function() {
		this.path_images = path.resolve(global.root_path + "/modules/MMM-ImagesPhotos/uploads" + this.config.path);
		if(this.config.debug)
		{console.log("path for : " + this.name +"= "+this.path_images);}
	},

	// Override socketNotificationReceived method.
	socketNotificationReceived: function(notification, payload) {
		if(notification==="CONFIG"){
			this.config=payload;
			this.setConfig();
			this.extraRoutes();
		}
	},

	// create routes for module manager.
	// recive request and send response
	extraRoutes: function() {
		var self = this;

		this.expressApp.get("/MMM-ImagesPhotos/photos", function(req, res) {
			self.getPhotosImages(req, res);
		});

		this.expressApp.use("/MMM-ImagesPhotos/photo", express.static(self.path_images));
	},

	// return photos-images by response in JSON format.
	getPhotosImages: function(req, res) {
		directoryImages = this.path_images;
		var imagesPhotos = this.getImages(this.getFiles(directoryImages)).map(function (img) {
			if(this.config.debug)
			  {console.log("have image="+img);}
			return {url: "/MMM-ImagesPhotos/photo/" + img};
		});
		//console.log("sending image list to module ="+imagesPhotos);
		res.send(imagesPhotos);
	},

	// return array with only images
	getImages: function(files) {
		var images = [];
		var enabledTypes = ["image/jpeg", "image/png", "image/gif"];
		for (idx in files) {
			type = mime.lookup(files[idx]);
			if (enabledTypes.indexOf(type) >= 0 && type !== false) {
				images.push(files[idx]);
			}
		}

		return images;
	},

	getFiles: function(path) {
		var files=[];
		try {
			files= fs.readdirSync(path).filter(function (file) {
				if (! fs.statSync(path + "/" + file).isDirectory() ) {
					return file;
				}
			});
		}
		catch(exception){
			console.log("getfiles unable to access source folder, will retry");
		}
		return files;
	},

});
