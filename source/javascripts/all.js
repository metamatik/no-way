(function() {
	// localStorage fallback
	// for all browsers
	// source: https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Storage
	if (!window.localStorage) {
		window.localStorage = {
			getItem: function (sKey) {
				if (!sKey || !this.hasOwnProperty(sKey)) { return null; }
				return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
			},
			key: function (nKeyId) {
				return unescape(document.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]);
			},
			setItem: function (sKey, sValue) {
				if(!sKey) { return; }
				document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
				this.length = document.cookie.match(/\=/g).length;
			},
			length: 0,
			removeItem: function (sKey) {
				if (!sKey || !this.hasOwnProperty(sKey)) { return; }
				document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
				this.length--;
			},
			hasOwnProperty: function (sKey) {
				return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
			}
		};
		window.localStorage.length = (document.cookie.match(/\=/g) || window.localStorage).length;

	}


	window.Views = {}

	//
	// View: PictureWall
	// Handle format: landscape/portrait
	// Set pictures close together
	// Save picture positions
	//


	// FIX : STocker la taille dans un cookie (ou +)
	// Stocker l'url de la page

	var PictureWall = function(el, options) {
		if (!options) options = {};
		this.el = el;

		// Init
		this.cleanMarkup();
		var _func = this.render.bind(this);
		$(window).on("resize", _.debounce(_func, 100));
	}

	PictureWall.prototype = {

		format: ["portrait", "landscape"],

		coords: function(el) {
			return {
				width: el.get(0).offsetWidth,
				height: el.get(0).offsetHeight
			}
		},

		set_grid: function() {
			this.grid = [];
			this.el.children().each(function(index, el) {
				line = Math.round(el.offsetTop / this._coords.height);
				if (!this.grid[line]) this.grid[line] = [];
				this.grid[line].push(el);
			}.bind(this));
		},

		width: function(line) {
			var last = _.last(line);
			return last.offsetLeft + last.offsetWidth;
		},

		stop: function() {
			this._index = 0;
			this.el.removeAttr("style");
		},


		nextAll: function(el, value) {
			var elements = null;
			var next = $(el).nextAll(this.path_referer()).get(0);
			if (next) elements = [next];
			return elements;
		},

		render: function() {
			this.stop();

			// Set the initial content to have the same result
			// when page will be re-loaded
			this.el.html(this._content);
			this.set_grid();

			var blank_min = 0;
			while(this._index < this.grid.length - 1) {
				var coords = this.coords(this.el);
				var line = this.grid[this._index];
				var width = this.width(line);

				// Do not move
				// if no white space
				var blank = Math.ceil(coords.width - width);
				if (blank) {

					var el = _.last(line);
					var elements = this.nextAll(el);

					if (elements) {
						// Move into DOM & array
						var elements_width = 0;
						for (var i=elements.length; i > 0; i--) {
							var element = elements[i - 1];
							elements_width += element.offsetWidth;
							$(el).after(element);
						}

						// Update Parent Size
						var size = elements_width + width;
						if (size > coords.width) this.el.width(size);

						// Update Context
						this.set_grid();
					}
				}
				// Goto Next Line
				++this._index;
			}
		},

		set_format: function(el, coords) {
			if (!coords) coords = this.coords($(el));
			var format = (coords.width < coords.height) ? this.format[0] : this.format[1];
			$(el).attr("data-format", format);
			return format;
		},

		get_format: function(el) {
			return $(el).attr("data-format");
		},

		path_referer: function() {
			return "[data-format=" + this.format[0] + "]"
		},

		cleanMarkup: function() {
			var bloc = null;
			var line_height;
			var className = {
				container: "bloc",
				single: "one-child"
			};

			var index_ref;
			var pictures = $("img", this.el);
			pictures.each(function(index, el){
				var _coords = this.coords($(el));

				// Tag each Picture
				var format = this.set_format(el, _coords);

				// Get The minimal Height
				// to define line_height
				if (format === this.format[0]) {
					if (!line_height || line_height > _coords.height) {
						index_ref = index;
						line_height = _coords.height;
					}
				}
			}.bind(this));

			pictures.get(index_ref);
			this._coords = this.coords($(pictures.get(index_ref)))

			pictures.each(function(index, el){
				var _coords = this.coords($(el));
				var format = this.get_format(el);

				if (format === this.format[1]) {
					var previous = $(el).prev();
					if (!previous.hasClass(className.container) || previous.children().length >= 2) {
						$(el).before('<div class="' + className.container + ' ' + className.single + '"></div>');
						previous = $(el).prev();
					}
					// Resize Landscape
					var height = line_height / 2;
					var width = _coords.width * line_height / _coords.height
					if (previous.children().length) {
						width = width / 2;
						previous.removeClass(className.single);
					}
					previous.height(line_height);
					previous.width(width);

					// Move Picture
					previous.append(el);
					return;
				}
				// Resize Portait
				$(el).width(this._coords.width);
				$(el).height(this._coords.height);

			}.bind(this));
			this._content = this.el.html();
		}
	}

	window.Views.PictureWall = PictureWall;

})()

