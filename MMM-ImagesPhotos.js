/* global Log MM Module */

/*
 * MagicMirror²
 * Module: MMM-ImagesPhotos
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
const ourModuleName = "MMM-ImagesPhotos";

Module.register(ourModuleName, {
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
    sequential: false
  },

  wrapper: null,
  suspended: false,
  timer: null,
  fullscreen: false,

  requiresVersion: "2.24.0", // Required version of MagicMirror

  start() {
    this.photos = [];
    this.loaded = false;
    this.lastPhotoIndex = -1;
    this.config.id = this.identifier;
    this.sendSocketNotification("CONFIG", this.config);
  },
  getStyles() {
    return ["MMM-ImagesPhotos.css"];
  },

  /*
   * Requests new data from api url helper
   */
  async getPhotos() {
    const urlApHelper = `/MMM-ImagesPhotos/photos/${this.identifier}`;
    const self = this;
    let retry = true;

    try {
      const photosResponse = await fetch(urlApHelper);

      if (photosResponse.ok) {
        const photosData = await photosResponse.json();
        self.processPhotos(photosData);
      } else if (photosResponse.status === 401) {
        self.updateDom(self.config.animationSpeed);
        Log.error(self.name, photosResponse.status);
        retry = false;
      } else {
        Log.error(self.name, "Could not load photos.");
      }

      if (!photosResponse.ok) {
        if (retry) {
          self.scheduleUpdate(self.loaded ? -1 : self.config.retryDelay);
        }
      }
    } catch (error) {
      Log.error(self.name, error);
    }
  },
  notificationReceived(notification, payload, sender) {
    // Hook to turn off messages about notiofications, clock once a second
    if (notification === "ALL_MODULES_STARTED") {
      const ourInstances = MM.getModules().withClass(ourModuleName);
      ourInstances.forEach((m) => {
        if (m.data.position.toLowerCase().startsWith("fullscreen")) {
          this.fullscreen = true;
        }
      });
    }
  },
  startTimer() {
    const self = this;
    self.timer = setTimeout(() => {
      // Clear timer value for resume
      self.timer = null;
      if (self.suspended === false) {
        self.updateDom(self.config.animationSpeed);
      }
    }, this.config.updateInterval);
  },

  socketNotificationReceived(notification, payload, source) {
    if (notification === "READY" && payload === this.identifier) {
      // Schedule update timer.
      this.getPhotos();
    }
  },

  /*
   * Schedule next update.
   *
   * argument delay number - Milliseconds before next update.
   *  If empty, this.config.updateInterval is used.
   */
  scheduleUpdate(delay) {
    let nextLoad = this.config.getInterval;
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay;
    }

    const self = this;
    setTimeout(() => {
      self.getPhotos();
    }, nextLoad);
  },

  /*
   * Generate a random index for a list of photos.
   *
   * argument photos Array<String> - Array with photos.
   *
   * return Number - Random index.
   */
  randomIndex(photos) {
    if (photos.length === 1) {
      return 0;
    }

    const generate = () => Math.floor(Math.random() * photos.length);

    let photoIndex =
      this.lastPhotoIndex === photos.length - 1 ? 0 : this.lastPhotoIndex + 1;
    if (!this.config.sequential) {
      photoIndex = generate();
    }
    this.lastPhotoIndex = photoIndex;

    return photoIndex;
  },

  /*
   * Retrieve a random photos.
   *
   * return photo Object - A photo.
   */
  randomPhoto() {
    const { photos } = this;
    const index = this.randomIndex(photos);

    return photos[index];
  },

  scaleImage(srcwidth, srcheight, targetwidth, targetheight, fLetterBox) {
    const result = { width: 0, height: 0, fScaleToTargetWidth: true };

    if (
      srcwidth <= 0 ||
      srcheight <= 0 ||
      targetwidth <= 0 ||
      targetheight <= 0
    ) {
      return result;
    }

    // Scale to the target width
    const scaleX1 = targetwidth;
    const scaleY1 = (srcheight * targetwidth) / srcwidth;

    // Scale to the target height
    const scaleX2 = (srcwidth * targetheight) / srcheight;
    const scaleY2 = targetheight;

    // Now figure out which one we should use
    let fScaleOnWidth = scaleX2 > targetwidth;
    if (fScaleOnWidth) {
      fScaleOnWidth = fLetterBox;
    } else {
      fScaleOnWidth = !fLetterBox;
    }

    if (fScaleOnWidth) {
      result.width = Math.floor(scaleX1);
      result.height = Math.floor(scaleY1);
      result.fScaleToTargetWidth = true;
    } else {
      result.width = Math.floor(scaleX2);
      result.height = Math.floor(scaleY2);
      result.fScaleToTargetWidth = false;
    }
    result.targetleft = Math.floor((targetwidth - result.width) / 2);
    result.targettop = Math.floor((targetheight - result.height) / 2);

    return result;
  },

  suspend() {
    this.suspended = true;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },
  resume() {
    this.suspended = false;
    if (this.timer === null) {
      this.startTimer();
    }
  },

  getDom() {
    if (this.fullscreen) {
      return this.getDomFS();
    }
    return this.getDomnotFS();
  },

  getDomnotFS() {
    const self = this;
    const wrapper = document.createElement("div");
    const photoImage = this.randomPhoto();

    if (photoImage) {
      const img = document.createElement("img");
      img.src = photoImage.url;
      img.id = "mmm-images-photos";
      img.style.maxWidth = this.config.maxWidth;
      img.style.maxHeight = this.config.maxHeight;
      img.style.opacity = self.config.opacity;
      img.className = "bgimage";
      wrapper.appendChild(img);
      self.startTimer();
    }
    return wrapper;
  },

  getDomFS() {
    const self = this;
    // If wrapper div not yet created
    if (this.wrapper === null) {
      // Create it once, try to reduce image flash on change

      this.wrapper = document.createElement("div");
      this.bk = document.createElement("div");
      this.bk.className = "bgimagefs";
      if (this.config.fill === true) {
        this.bk.style.filter = `blur(${this.config.blur}px)`;
        this.bk.style["-webkit-filter"] = `blur(${this.config.blur}px)`;
      } else {
        this.bk.style.backgroundColor = this.config.backgroundColor;
      }
      this.wrapper.appendChild(this.bk);
      this.fg = document.createElement("div");
      this.wrapper.appendChild(this.fg);
    }
    if (this.photos.length) {
      // Get the size of the margin, if any, we want to be full screen
      const m = window
        .getComputedStyle(document.body, null)
        .getPropertyValue("margin-top");
      // Set the style for the containing div

      this.fg.style.border = "none";
      this.fg.style.margin = "0px";

      const photoImage = this.randomPhoto();
      let img = null;
      if (photoImage) {
        // Create img tag element
        img = document.createElement("img");

        // Set default position, corrected in onload handler
        img.style.left = `${0}px`;
        img.style.top = document.body.clientHeight + parseInt(m, 10) * 2;
        img.style.position = "relative";

        img.src = photoImage.url;
        // Make invisible
        img.style.opacity = 0;
        // Append this image to the div
        this.fg.appendChild(img);

        /*
         * Set the onload event handler
         * The loadurl request will happen when the html is returned to MM and inserted into the dom.
         */
        img.onload = (evt) => {
          // Get the image of the event
          const eventImage = evt.currentTarget;
          Log.log(
            `image loaded=${eventImage.src} size=${eventImage.width}:${eventImage.height}`
          );

          // What's the size of this image and it's parent
          const w = eventImage.width;
          const h = eventImage.height;
          const tw = document.body.clientWidth + parseInt(m, 10) * 2;
          const th = document.body.clientHeight + parseInt(m, 10) * 2;

          // Compute the new size and offsets
          const result = self.scaleImage(w, h, tw, th, true);

          // Adjust the image size
          eventImage.width = result.width;
          eventImage.height = result.height;

          Log.log(`image setting size to ${result.width}:${result.height}`);
          Log.log(
            `image setting top to ${result.targetleft}:${result.targettop}`
          );

          // Adjust the image position
          eventImage.style.left = `${result.targetleft}px`;
          eventImage.style.top = `${result.targettop}px`;

          // If another image was already displayed
          const c = self.fg.childElementCount;
          if (c > 1) {
            for (let i = 0; i < c - 1; i++) {
              // Hide it
              self.fg.firstChild.style.opacity = 0;
              self.fg.firstChild.style.backgroundColor = "rgba(0,0,0,0)";
              // Remove the image element from the div
              self.fg.removeChild(self.fg.firstChild);
            }
          }
          self.fg.firstChild.style.opacity = self.config.opacity;

          self.fg.firstChild.style.transition = "opacity 1.25s";
          if (self.config.fill === true) {
            self.bk.style.backgroundImage = `url(${self.fg.firstChild.src})`;
          }
          self.startTimer();
        };
      }
    }
    return this.wrapper;
  },

  getScripts() {
    return ["MMM-ImagesPhotos.css"];
  },

  processPhotos(data) {
    const self = this;
    this.photos = data;
    if (this.loaded === false) {
      if (this.suspended === false) {
        self.updateDom(self.config.animationSpeed);
      }
    }
    this.loaded = true;
  }
});
