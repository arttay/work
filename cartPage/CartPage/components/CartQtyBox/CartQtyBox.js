
         /**
         * @module Shopper/CartQtyBox
         * @memberof module:Shopper/Cart
         *
         * @example <caption>Implementation html</caption>
         * <div  rel='dr-cartQtyBox' data-lineItemId="{id}" data-qty="{quantity}">
         * </div>
         *
         * @example <caption>Implementation Javascript</caption>
         * new CartQtyBox({
         *      el: $('[rel="dr-cartQtyBox"]')
         *   });
         */
(function (root, factory) {
    if ('function' === typeof define && define.amd) {
        define([
            'jquery',
            'underscore',
            'ShoppersApiCore',
            'Cart',
            'text!CartPage/components/CartQtyBox/cartQtyBox-tmpl.html'
        ], factory);
    }
}(this, function ($, _, ShoppersApiCore, Cart, tmpl) {
    var CartQtyBox = ShoppersApiCore.BaseView.extend({
        init: function (options) {
            this._super.apply(this, arguments);

            options = (options || {});
            _.extend(this, _.pick(options, this.displayOptions));

            if (! this.tmpl) {
                this.tmpl = tmpl;
            }
            this.compileTemplates();

            _.each(this.$el, function (value) {
                this.renderBox(value, $(value).data());
            }.bind(this));

            this.listeners();
        },

        listeners: function () {

            this.$el.on("click", '[rel="dr-refreshCartQty"]', function (e) {
                e.stopImmediatePropagation();
                var parent      = $(e.currentTarget).parentsUntil('[rel="dr-cartQtyBox"]')[1],
                    qty         = $(parent).find("#quantity").val(),
                    itemId      = $(e.currentTarget).data("lineitemid"),
                    obj         = {
                        itemId: itemId,
                        itemCount: qty
                    };

                $(document).trigger("dr-refreshCartQty.cart", [obj]);
            }.bind(this));

            this.$el.on("click", '[rel="dr-removeCartQty"]', function (e) {
                e.stopImmediatePropagation();
                $(document).trigger("dr-removeCartQty.cart", [e]);
            }.bind(this));

        },

        compileTemplates: function () {
            this.template = (typeof this.tmpl === 'function' ? this.tmpl : _.template(this.tmpl));
        },

        renderBox: function (el, data) {
            $(el).html(this.template(data));

        },

        render: function () {
            if (!this.$el.length) {
                this.setElement(this.$el.appendTo(this.$parent));
            }

            this.$el.html(this.template());

            // enable chaining
            return this.$el;
        },

    });

    return CartQtyBox;
}));
