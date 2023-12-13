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
	config:{},
	path_images:{},
	start: function() {
		var self = this;
		console.log("Starting node helper for: " + this.name);
	},

	setConfig: function(id) {
		if(this.config[id].debug)
			console.log("setconfig path="+id)
		this.path_images[id] = path.resolve(global.root_path , "modules/MMM-ImagesPhotos/uploads" , this.config[id].path);
		if(this.config[id].debug)
		{console.log("path for : " + this.name+" "+ id +"= "+this.path_images[id]);}
	},

	// Override socketNotificationReceived method.
	socketNotificationReceived: function(notification, payload) {
		if(notification==="CONFIG"){
			console.log(" config based debug="+payload.id)
			this.config[payload.id]=payload;
			this.setConfig(payload.id);
			this.extraRoutes(payload.id);
			this.sendSocketNotification("READY", payload.id);
		}
	},

	// create routes for module manager.
	// recive request and send response
	extraRoutes: function(id) {
		if(this.config[id].debug)
			console.log("setting path="+id)
		var self = this;

		this.expressApp.get("/MMM-ImagesPhotos/photos/"+id, function(req, res) {
			self.getPhotosImages(req, res,id);
		});

		this.expressApp.use("/MMM-ImagesPhotos/photo/"+id, express.static(self.path_images[id]));
	},

	// return photos-images by response in JSON format.
	getPhotosImages: function(req, res,id) {
		if(this.config[id].debug)
			console.log("gpi id="+id)
		directoryImages = this.path_images[id];
		let imgs=this.getFiles(directoryImages,id)
		var imagesPhotos = this.getImages(imgs,id).map((img) =>{
			if(this.config[id].debug){
			  	console.log(id+" have image="+img);
			}
			return {url: "/MMM-ImagesPhotos/photo/"+id+'/' + img};
		});
		res.send(imagesPhotos);
	},

	// return array with only images
	getImages: function(files,id) {
		if(this.config[id].debug)
			console.log("gp id="+id)
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

	getFiles: function(path,id) {
		if(this.config[id].debug)
			console.log("gf id="+id)
		var files=[];
		var folders = []
		try {
			//console.log("finding files on path="+path)
			files= fs.readdirSync(path).filter( (file) =>{
				if(this.config[id].debug)
					console.log("found file="+file+" on path="+path)
				if (! fs.statSync(path + "/" + file).isDirectory() ) {
					if(!file.startsWith("."))
						return file;
				}
				else {
					if(this.config[id].debug){
						console.log(id+" saving folder path="+path + "/" + file)
					}
					folders.push(path + "/" + file)
				}
			});

			folders.forEach((x)=>{
				if(this.config[id].debug){
					console.log(id+ " processing for sub folder="+x)
				}
				let y = this.getFiles(x,id)
				//console.log("list"+JSON.stringify(y))
				let worklist=[]
				// get the number of elements in the base path
				let c = this.path_images[id].split('/').length
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
				if(this.config[id].debug){
					console.log("files after concat="+JSON.stringify(files))
				}
			})
		}
		catch(exception){
			console.log("getfiles unable to access source folder,path="+path+" will retry, exception="+JSON.stringify(exception));
		}
		if(this.config[id].debug){
			console.log(id+" returning files="+JSON.stringify(files))
		}

		return files;
	}

});
