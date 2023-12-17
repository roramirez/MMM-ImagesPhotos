/* global Module */

/* Magic Mirror
 * Module: MMM-ImagesPhotos
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
const ourModuleName="MMM-ImagesPhotos"

Module.register(ourModuleName,{
	defaults: {
		opacity: 0.9,
		animationSpeed: 500,
		updateInterval: 5000,
		getInterval: 60000,
		maxWidth: "100%",
		maxHeight: "100%",
		retryDelay: 2500,
		path: "",
		fill: false,
		blur: 8,
		sequential:false
	},

	wrapper: null,
	suspended: false,
	timer:null,
	fullscreen: false,

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		var self = this;
		this.photos = [];
		this.loaded = false;
		this.lastPhotoIndex = -1;
		this.config['id']=this.identifier
		this.sendSocketNotification("CONFIG", this.config);
	},
	getStyles: function() {
		return ["MMM-ImagesPhotos.css"];
	},

	/*
   * getPhotos
   * Requests new data from api url helper
   *
   */
	getPhotos: function() {
		var urlApHelper = "/MMM-ImagesPhotos/photos/"+this.identifier;
		var self = this;
		var retry = true;

		var photosRequest = new XMLHttpRequest();
		photosRequest.open("GET", urlApHelper, true);
		photosRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processPhotos(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.updateDom(self.config.animationSpeed);
					Log.error(self.name, this.status);
					retry = false;
				} else {
					Log.error(self.name, "Could not load photos.");
				}

				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		photosRequest.send();
	},
	notificationReceived(notification,payload,sender){
		// hook to turn off messages about notiofications, clock once a second
		if(notification=="ALL_MODULES_STARTED"){
			const ourInstances=MM.getModules().withClass(ourModuleName)
			ourInstances.forEach(m=>{
				if(m.data.position.toLowerCase().startsWith("fullscreen")){
					this.fullscreen= true;
				}
			})

		}
	},
	startTimer: function(){
		let self = this;
		self.timer=setTimeout(() => {
			  // clear timer value for resume
			self.timer=null;
			if(self.suspended==false){
				self.updateDom(self.config.animationSpeed);
			}
		}, this.config.updateInterval);
	},

	socketNotificationReceived(notification, payload, source){
		if(notification == "READY" && payload===this.identifier) {
			let self = this;
			// Schedule update timer.
			this.getPhotos();
			//this.startTimer();
		}
	},
	/* scheduleUpdate()
   * Schedule next update.
   *
   * argument delay number - Milliseconds before next update.
   *  If empty, this.config.updateInterval is used.
   */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.getInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad ;
		var self = this;
		setTimeout(function() {
			self.getPhotos();
		}, nextLoad);
	},

	/* randomIndex(photos)
   * Generate a random index for a list of photos.
   *
   * argument photos Array<String> - Array with photos.
   *
   * return Number - Random index.
   */
	randomIndex: function(photos) {
		if (photos.length === 1) {
			return 0;
		}

		var generate = function() {
			return Math.floor(Math.random() * photos.length);
		};

		var photoIndex = (this.lastPhotoIndex==photos.length-1?0:this.lastPhotoIndex+1);
		if(!this.config.sequential)
			photoIndex =generate();
		this.lastPhotoIndex = photoIndex;

		return photoIndex;
	},

	/* complimentArray()
   * Retrieve a random photos.
   *
   * return photo Object - A photo.
   */
	randomPhoto: function() {
		var photos = this.photos;
		var index = this.randomIndex(photos);

		return photos[index];
	},

	ScaleImage: function(srcwidth, srcheight, targetwidth, targetheight, fLetterBox) {

		var result = { width: 0, height: 0, fScaleToTargetWidth: true };

		if ((srcwidth <= 0) || (srcheight <= 0) || (targetwidth <= 0) || (targetheight <= 0)) {
			return result;
		}

		// scale to the target width
		var scaleX1 = targetwidth;
		var scaleY1 = (srcheight * targetwidth) / srcwidth;

		// scale to the target height
		var scaleX2 = (srcwidth * targetheight) / srcheight;
		var scaleY2 = targetheight;

		// now figure out which one we should use
		var fScaleOnWidth = (scaleX2 > targetwidth);
		if (fScaleOnWidth) {
			fScaleOnWidth = fLetterBox;
		}
		else {
			fScaleOnWidth = !fLetterBox;
		}

		if (fScaleOnWidth) {
			result.width = Math.floor(scaleX1);
			result.height = Math.floor(scaleY1);
			result.fScaleToTargetWidth = true;
		}
		else {
			result.width = Math.floor(scaleX2);
			result.height = Math.floor(scaleY2);
			result.fScaleToTargetWidth = false;
		}
		result.targetleft = Math.floor((targetwidth - result.width) / 2);
		result.targettop = Math.floor((targetheight - result.height) / 2);

		return result;
	},

	suspend: function(){
		this.suspended=true;
		if(this.timer!=null){
			clearTimeout(this.timer);
			this.timer=null;
		}
	},
	resume: function(){
		this.suspended=false;
		if(this.timer==null)
		{this.startTimer();}
	},

  getDom(){
  	if(this.fullscreen)
  		return this.getDomFS()
  	else
  		return this.getDomnotFS()
  },

  getDomnotFS(){
		var self = this;
		var wrapper = document.createElement("div");
		var photoImage = this.randomPhoto();

		if (photoImage) {
			var img = document.createElement("img");
			img.src = photoImage.url;
			img.id = "mmm-images-photos";
			img.style.maxWidth = this.config.maxWidth;
			img.style.maxHeight = this.config.maxHeight;
			img.style.opacity = self.config.opacity;
			img.className = "bgimage"
			wrapper.appendChild(img);
		}
		return wrapper;
  },


	getDomFS: function() {
		let self = this;
		// if wrapper div not yet created
		if(this.wrapper ==null)
		// create it once, try to reduce image flash on change
		{this.wrapper = document.createElement("div");
		  this.bk=document.createElement("div");
			this.bk.className="bgimagefs";
			if(this.config.fill== true){
				this.bk.style["filter"] ="blur("+this.config.blur+"px)";
				this.bk.style["-webkit-filter"] ="blur("+this.config.blur+"px)";
			}
			else
			{this.bk.style.backgroundColor = this.config.backgroundColor;}
			this.wrapper.appendChild(this.bk);
			this.fg=document.createElement("div");
			this.wrapper.appendChild(this.fg);
		}
		if(this.photos.length) {

			// get the size of the margin, if any, we want to be full screen
			let m = window.getComputedStyle(document.body,null).getPropertyValue("margin-top");
			// set the style for the containing div

			this.fg.style.border = "none";
			this.fg.style.margin = "0px";

			var photoImage = this.randomPhoto();
			var img = null;
			if (photoImage) {

				// create img tag element
				img = document.createElement("img");

				// set default position, corrected in onload handler
				img.style.left = 0+"px";
				img.style.top = document.body.clientHeight+(parseInt(m)*2);
				img.style.position="relative";

				img.src = photoImage.url;
				// make invisible
				img.style.opacity = 0;
				// append this image to the div
				this.fg.appendChild(img);

				// set the onload event handler
				// the loadurl request will happen when the html is returned to MM and inserted into the dom.
				img.onload=  (evt) => {

					// get the image of the event
					let img = evt.currentTarget;
					Log.log("image loaded="+img.src+" size="+img.width+":"+img.height);

					// what's the size of this image and it's parent
					var w = img.width;
					var h = img.height;
					var tw = document.body.clientWidth+(parseInt(m)*2);
					var th = document.body.clientHeight+(parseInt(m)*2);

					// compute the new size and offsets
					var result = self.ScaleImage(w, h, tw, th, true);

					// adjust the image size
					img.width = result.width;
					img.height = result.height;

					Log.log("image setting size to "+result.width+":"+result.height);
					Log.log("image setting top to "+result.targetleft+":"+result.targettop);

					// adjust the image position
					img.style.left = result.targetleft+"px";
					img.style.top = result.targettop+"px";

					// if another image was already displayed
					let c = self.fg.childElementCount;
					if( c>1)
					{
						for( let i =0 ; i<c-1;i++){
							// hide it
							self.fg.firstChild.style.opacity=0;
							self.fg.firstChild.style.backgroundColor = "rgba(0,0,0,0)";
							// remove the image element from the div
							self.fg.removeChild(self.fg.firstChild);
						}
					}
					self.fg.firstChild.style.opacity = self.config.opacity;

					self.fg.firstChild.style.transition = "opacity 1.25s";
					if(self.config.fill== true){
						self.bk.style.backgroundImage = "url("+self.fg.firstChild.src+")";
					}
					self.startTimer();
				};
			}
		}
		return this.wrapper;
	},

	getScripts: function() {
		return ["MMM-ImagesPhotos.css"];
	},

	processPhotos: function(data) {
		var self = this;
		this.photos = data;
		if (this.loaded === false) {
			if(this.suspended==false) {
				self.updateDom(self.config.animationSpeed) ;
			}
		}
		this.loaded = true;
	},

});
