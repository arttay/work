        /**
         * @module BrandUpload
         * @memberof module:Editor/DesignEditor
         */
(function (root, factory) {
    if ('function' === typeof define && define.amd) {
        define([
            'jquery',
            'underscore',
            'ShoppersApiCore',
            'Input/Input',
            'Link/Link',
            'text!Admin/DesignEditor/BrandUpload/brandUpload-tmpl.html'
        ], factory);
    }
}(this, function ($, _, ShoppersApiCore, Input, Link, html) {
    return ShoppersApiCore.BaseView.extend({
            /*jshint unused: false */
        init: function (options) {
            options = (options || {});
            var self = this;
            this._super.apply(this, arguments);
            _.extend(this, _.pick(options, this.displayOptions));

            this.siteId = options.siteId;

            this.tmpl = html;
            this.compileTemplate();
            this.render();

            this.form = this.$el.find("#uploadHeader");

            this.pageHeader = new Input({
                parent: this.form,
                displayName: "Logo for Large Screens",
                name: "largeLogo",
                inputClass: "form-control small",
                id: "largeLogo",
                type: "file"
            });

            this.smallLogo = new Input({
                parent: this.form,
                displayName: "Logo for Small Screens",
                name: "smallLogo",
                inputClass: "form-control small",
                id: "smallLogo",
                type: "file"
            });

            this.favicon = new Input({
                parent: this.form,
                displayName: "Favicon",
                name: "favicon",
                inputClass: "form-control small",
                id: "favicon",
                type: "file"
            });

            this.uploadApplyLink = new Link({
                el: this.$el,
                text: "Apply",
                className: "btn btn-primary pull-right dr-applyLogos",
                href: "#"
            });

            this.listeners();

            this.form.attr("enctype", "multipart/form-data").attr("encoding", "multipart/form-data");
        },

        listeners: function () {
            this.uploadApplyLink.$el.on("click", '.dr-applyLogos', function () {
                var formData = this.createFormData();
                this.$el.trigger("dr-fileUpload.submit", [formData]);
            }.bind(this));
        },


        /**
         * Searches all input files in this.$el for ones that have data in them.
         * It create sa new FormData Object and appends all input fields to it
         *
         *
         * @returns {Object} FormData object with all input fields with data in them
         */
        createFormData: function () {
            var formData = new FormData();
            this.$el.find('input').each(function (key, data) {
                if (data.files !== null && data.files.length) {
                    formData.append(data.name, data.files[0]);
                }
            });
            return formData;
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

            this.$el.append(this.template({siteId: this.siteId}));

            // enable chaining
            return this.$el;
        }
    });
}));
