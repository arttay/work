        /**
         * @module ThemesColors
         * @memberof module:Editor/DesignEditor
         *
         *
         */
(function (root, factory) {
    if ('function' === typeof define && define.amd) {
        define([
            'jquery',
            'underscore',
            'ShoppersApiCore',
            'minicolors',
            'service/SettingService',
            'Select/Select',
            'Input/Input',
            'Link/Link',
            'text!Admin/DesignEditor/ThemesColors/defaultThemeColors.json',
        ], factory);
    }
}(this, function ($, _, ShoppersApiCore, minicolors, SettingService, Select, Input, Link, defaultThemeSettings) {
    return ShoppersApiCore.BaseView.extend({

        init: function (options) {
            this._super.apply(this, arguments);

            options = (options || {});
            _.extend(this, _.pick(options, this.displayOptions));

            this.siteId = options.siteId;

            this.compileTemplates();

            this.render();

            this.defaultThemeSettings = JSON.parse(defaultThemeSettings);


            //todo: this thing is hude, look at ways to cut it down
            this.primaryColor = new Input({
                el: this.$el,
                displayName: "Primary",
                name: "PrimaryColor",
                className: 'primaryColor cssColor',
                inputClass: 'form-control small colorPick',
                labelClass: 'pull-left'
            });

            this.successColor = new Input({
                el: this.$el,
                displayName: "Success",
                name: "SuccessColor",
                className: 'successColor cssColor',
                inputClass: 'form-control small colorPick',
                labelClass: 'pull-left'
            });

            this.warningColor = new Input({
                el: this.$el,
                displayName: "Warning",
                name: "WarningColor",
                className: 'warningColor cssColor',
                inputClass: 'form-control small colorPick',
                labelClass: 'pull-left'
            });

            this.errorColor = new Input({
                el: this.$el,
                displayName: "Error",
                name: "ErrorColor",
                className: 'errorColor cssColor',
                inputClass: 'form-control small colorPick',
                labelClass: 'pull-left'
            });

            this.infoColor = new Input({
                el: this.$el,
                displayName: "Info",
                name: "InfoColor",
                className: 'infoColor cssColor',
                inputClass: 'form-control small colorPick',
                labelClass: 'pull-left'
            });

            this.bgColor = new Input({
                el: this.$el,
                displayName: "Background",
                name: "BackgroundColor",
                className: 'bgColor cssColor',
                inputClass: 'form-control small colorPick',
                labelClass: 'pull-left'
            });

            this.textColor = new Input({
                el: this.$el,
                displayName: "Text",
                name: "TextColor",
                className: 'textColor cssColor',
                inputClass: 'form-control small colorPick',
                labelClass: 'pull-left'
            });

            this.linkColor = new Input({
                el: this.$el,
                displayName: "Link",
                name: "LinkColor",
                className: 'linkColor cssColor',
                inputClass: 'form-control small colorPick',
                labelClass: 'pull-left'
            });

            this.hoverColor = new Input({
                el: this.$el,
                displayName: "Link Hover",
                name: "HoverColor",
                className: 'hoverColor cssColor',
                inputClass: 'form-control small colorPick',
                labelClass: 'pull-left'
            });

            this.defaultColorsLink = new Link({
                el: this.$el,
                text: "Reset",
                className: "btn pull-left defaultThemeColors",
                href: "#"
            });

            this.applyCustomColorsLink = new Link({
                el: this.$el,
                text: "Apply",
                className: "btn btn-primary pull-right applyCustomColors",
                href: "#"
            });

            // TODO items needs to be retrieved from settings service.
            this.themeSelect = new Select({
                selectId: "presentationCss",
                parent: this.$el,
                name: 'presentationCss',
                items: [
                    {
                        value: "slate",
                        displayName: "Dark"
                    },
                    {
                        value: "spring",
                        displayName: "Light"
                    }
                ]
            });

            this.listeners();
        },

        listeners: function () {

            this.themeSelect.$el.on("dr-change.select", function (evt, name, data) {
                // TODO Re-factor this into the list service
                var prop = {
                    propertyId: 'template',
                    propertyName: name,
                    propertyValue: data
                };

                SettingService.post(prop).then(function () {
                    $(document).trigger("dr-showLoadingBar.preview");
                    this.$el.trigger('dr-cssThemeSelect.themeSwitch', data);
                }.bind(this), function (err) {
                    console.log(err);
                });
            }.bind(this));


            this.applyCustomColorsLink.$el.on("click", ".applyCustomColors", function (e) {
                e.stopPropagation();
                var styles = this.getStyles(this.$el);
                var ops = {
                    theme: this.currentTheme,
                    data: styles
                };
                this.$el.trigger("dr-applyCustomColors.theme", [ops]);
            }.bind(this));



            this.defaultColorsLink.$el.on("click", ".defaultThemeColors", function (e) {
                e.stopPropagation();
                var ops = {
                    theme: this.currentTheme,
                };
                this.$el.trigger("dr-defaultColorApply.theme", [ops]);
            }.bind(this));
        },


        /**
         * Takes the value of the inputs in the param(parent) and converts them into an object
         *
         * @param {String} Element you want to search for inputs
         * @returns {Object} An object containing key/value paris of variable/color
         */
        getStyles: function (parent) {
            var style = {};
            var colors = $(parent).find(".minicolors-input");
            _.each(colors, function (data) {
                style[data.name] = $(data).val();
            });
            return style;
        },

        /**
         * Sets the current select of the theme select drop down
         *
         * @param {String} Name of theme to set as current select theme
         *
         */

        loadThemeSelect: function (themeName) {
            this.themeSelect.setValue(themeName);
        },


        compileTemplates: function () {
            this.template = (typeof this.tmpl === 'function' ? this.tmpl : _.template(this.tmpl));
        },

        render: function () {
            this.$el = $(this.el);

            if (!this.$el.length) {
                this.setElement(this.$el.appendTo(this.$parent));
            }

            this.$el.append(this.template());
            return this.$el;
        }
    });
}));
