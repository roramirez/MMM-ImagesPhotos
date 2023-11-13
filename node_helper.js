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
			this.sendSocketNotification("READY");
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
		let imgs=this.getFiles(directoryImages)
		var imagesPhotos = this.getImages(imgs).map(function (img) {
			if(this.config.debug){
			  	console.log("have image="+img);
			  }
			return {url: "/MMM-ImagesPhotos/photo/" + img};
		});
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
		var folders = []
		try {
			files= fs.readdirSync(path).filter(function (file) {
				//console.log("found file="+file+" on path="+path)
				if (! fs.statSync(path + "/" + file).isDirectory() ) {
					if(!file.startsWith("."))
						return file;
				}
				else {
					if(this.config.debug){
						console.log("saving folder path="+path + "/" + file)
					}
					folders.push(path + "/" + file)
				}
			});

			folders.forEach((x)=>{
				if(this.config.debug){
					console.log("processing for sub folder="+x)
				}
				let y = this.getFiles(x)
				//console.log("list"+JSON.stringify(y))
				let worklist=[]
				// get the number of elements in the base path
				let c = this.path_images.split('/').length
				// get the rest of the path
				let xpath=x.split('/').slice(c).join('/')
				y.forEach(f=>{
					// if the file doesn't have a path
					if(!f.includes("/"))
						// add it
						worklist.push(xpath+"/"+f)
					else
						// use it as is
						worklist.push(f)
				})
				// add to the files list
				files=files.concat(worklist)
				if(this.config.debug){
					console.log("files after concat="+JSON.stringify(files))
				}
			})
		}
		catch(exception){
			console.log("getfiles unable to access source folder, will retry, exception="+JSON.stringify(exception));
		}
		if(this.config.debug){
			console.log("returning files="+JSON.stringify(files))
		}

		return files;
	}

});
