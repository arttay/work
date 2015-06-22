        /**
         * @module Editor/DesignEditor
         *
         *
         *
         */
(function (root, factory) {
    if ('function' === typeof define && define.amd) {
        define([
            'jquery',
            'underscore',
            'ShoppersApiCore',
            'Admin/DesignEditor/BrandUpload/BrandUpload',
            'Admin/DesignEditor/ThemesColors/ThemesColors',
            "text!Admin/DesignEditor/ThemesColors/defaultThemeColors.json",
            "text!Admin/DesignEditor/DesignEditor/designEditor-tmpl.html"
        ], factory);
    }
}(this, function ($, _, ShoppersApiCore, BrandUpload, ThemesColors, defaultThemeColors, html) {

    return ShoppersApiCore.BaseView.extend({
        displayOptions : [],

        init: function (options) {
            this._super.apply(this, arguments);

            options = (options || {});
            _.extend(this, _.pick(options, this.displayOptions));

            this.siteId = options.siteId;
            this.tmpl = html;

            this.compileTemplate();
            this.render();

            this.defaultThemeColors = JSON.parse(defaultThemeColors);

            this.brandUpload = new BrandUpload({
                el: $("#designPanelLogosForm .panel-body"),
                parent: $('#uploadHeader'),
                siteId: this.siteId
            });

            this.themesColors =  new ThemesColors({
                el: $("#themes .panel-body"),
                siteId: this.siteId
            });


            this.listeners();
            this.loadTheme();

            this.themesColors.loadThemeSelect(this.getCurrentTheme());

        },

        listeners: function () {
          var self = this;
            this.themesColors.$el.on("dr-applyCustomColors.theme", function (e, ops) {
                ops = JSON.stringify(ops);
                this.ajax("POST", "/" + this.siteId + "/admin/setTheme", ops).then(function () {
                    $(document).trigger("dr-showLoadingBar.preview");
                    this.loadTheme(true);
                }.bind(this), function (err) {
                    console.log(err);
                });
            }.bind(this));


            this.themesColors.$el.on("dr-defaultColorApply.theme", function (e, ops) {
                var defaultColors = this.defaultThemeColors[this.getCurrentTheme()];
                this.setThemeColors(defaultColors);

                ops.data = defaultColors;
                ops = JSON.stringify(ops);

                this.ajax("POST", "/" + this.siteId + "/admin/setTheme", ops).then(function () {
                    $(document).trigger("dr-showLoadingBar.preview");
                    this.loadTheme(true);
                }.bind(this), function (err) {
                    console.log(err);
                });
            }.bind(this));


            this.themesColors.$el.on("dr-cssThemeSelect.themeSwitch", function (evt, data) {
                // When a user selects a new theme;  data is theme name
                var theme = JSON.stringify({ "theme": data.toLowerCase() });

                this.ajax("POST", '/' + self.siteId + '/admin/postTheme', theme)
                    .then(function () {
                      self.setCurrentTheme(data);
                      self.loadTheme(true);
                    });
            }.bind(this));


            this.themesColors.$el.on("dr-reRenderThemeCss.theme", function (e, flat) {
                flat = JSON.stringify(flat);
                this.ajax("POST", "/" + this.siteId + "/admin", flat).then(function () {
                    $(document).trigger("dr-update");
                });
            }.bind(this));



            this.brandUpload.$el.on("dr-fileUpload.submit", function (e, formData) {
                this.ajax("POST", "/" + this.siteId + "/admin", formData, "multipart/form-data", 'false')
                    .then(function (e) {
                        /*jshint unused: false*/
                        $(document).trigger("dr-update");
                    }.bind(this));
            }.bind(this));



        },

        getSiteId: function (cookie) {
            //todo: this shouldnt be needed anymore...?
            var value = "; " + document.cookie,
                parts = value.split("; " + cookie + "="),
                siteId;

            if (parts.length == 2) {
                siteId = parts.pop().split(";").shift();
            }

            return siteId;
        },

        /**
         * Used to load a theme. Grabs the current theme and stores theme name, settings and default values.
         * @returns {Promise}
         */
        loadTheme: function (reRender) {
            var currentTheme = this.getCurrentTheme(),
                url  =  ["", this.siteId, 'admin', 'getTheme'].join("/"),
                data = {settingName: 'themes', key: currentTheme};
               
            this.themesColors.currentTheme = currentTheme;

            return this.getCurrentThemeSettings(currentTheme, url, data).then(function (themeData) {
                this.themesColors.defaultColors = this.defaultThemeColors[currentTheme];
                this.loadThemeCss(themeData, reRender);
            }.bind(this)).fail(function (err) {
                    throw err;
            });


        },

        /**
         * Gets the current theme as a promise.
         *
         * @returns {Promise} Returns a promise with the current theme as its data
         */
        getCurrentThemePromise: function () {
            return $.Deferred().resolve(this.$el.data("currenttheme"));
        },

        /**
         * Gets teh current theme name as a string
         *
         * @returns {String} Name of the current theme
         */
        getCurrentTheme: function () {
            return this.$el.data("currenttheme");
        },

        /**
         * Sets the theme name in a data attribute
         *
         * @param {String} What you want to set as the theme name.
         */
        setCurrentTheme: function (theme) {
            //note: this does not modify the dataset property 
            this.$el.data("currenttheme", theme);
        },

        /**
         * Gets the settings/colors for the current theme
         *
         * @param {String} Name of theme you want to get data for
         * @param {String} Route you want to get data from
         * @param {Object} Mongo Database info for selecting collections
         * @returns {Promise}
         */
        getCurrentThemeSettings: function (themeName, route,  data) {
            return this.ajax("GET", route, data);
        },


        /**
         * Pass through function: checking where the call is comming from, page load or an event
         *
         * @param {Object} cookieName The name of the cookie to parse for.
         * @param {Boolean} Detecting if its coming from page load or an event
         */
        loadThemeCss: function (data, reRender) {
            if (reRender !== undefined) {
                var flat = {
                    body: this.flatCss(data),
                    css: true,
                    theme: this.getCurrentTheme()
                };
                this.themesColors.$el.trigger('dr-reRenderThemeCss.theme', [flat]);
                this.resetMiniColors(data);
          } else {
              this.setThemeColors(data);
            }

        },

        /**
         * Creates a flat object for SASS variables
         *
         * @param {Object} Key/value pairs for the name of the variable and its value
         * @returns {Object}
         */
        flatCss: function (css) {
            var flatCss = {};
            _.each(css, function (data, key) {
                if (flatCss.length === undefined) {
                    flatCss = "$" + key + ":" + data + ";";
                } else {
                    flatCss += "$" + key + ":" + data + ";";
                }
            });
            flatCss.css = true;
            return flatCss;
        },


        /**
         * Loops through an object of a css Object, uses setThemeData to place the data in the DOM
         *
         * @param {Object} CSS object with key/value paris of variable name/value
         */
        setThemeColors: function (data) {
            _.each(data, function (data, key) {
                var $inputs = $("#themes [name='" + key + "']");
                this.setThemeData($inputs, data);
            }.bind(this));
        },


        /**
         * Instantiate minicolors
         *
         * @param {String} Name of variable to set
         * @param {String} Value to set
         */
        setThemeData: function (data, value) {
            var position;
            data[0].name === 'PrimaryColor' ? position = 'bottom right' : position = 'top right';

            data.minicolors({
                position: position,
                defaultValue: value
            });
        },

        resetMiniColors: function (data) {
          _.each(data, function (data, key) {
              var $inputs = $("#themes [name='" + key + "']");
              $inputs.minicolors('value', data);
          }.bind(this));
        },

        /**
         * General ajax function
         *
         * @param {String} Method of ajax call
         * @param {String} Route to get call/get data from
         * @param {Object} Data to send to server
         * @param {String} [null] MimmeType
         * @param {Boolean} [true] Process data
         * @returns {*}
         */
        ajax: function (method, route, data, mimeType, process) {
            return $.ajax({
                url: route,
                method: method,
                cache: false,
                mimeType: mimeType || null,
                processData: process === 'false' ? false : true,
                contentType: process === 'false' ? false : 'application/json',
                data: data
            })
            .fail(function (err) {
                console.log(err);
            });
        },

        compileTemplate : function () {
            this.template = ('string' === typeof this.tmpl ? _.template(this.tmpl) : this.tmpl);
        },

        render: function () {
            this.$el = $(this.el);


            /* jshint unused: false*/
            var html = "";
            if (!this.$el.length) {
                this.setElement(this.$el.appendTo(this.$parent));
            }

            this.$el.append(this.template({selectId: this.selectId, label: this.label, items: this.items, selected: this.selected}));

            // enable chaining
            return this.$el;
        }
    });
}));
