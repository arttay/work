(function (root, factory) {
    if ('function' === typeof define && define.amd) {
        define([
            'jquery',
            'underscore',
            'ShoppersApiCore',
            'CartPage/components/CartQtyBox/CartQtyBox'
        ], factory);
    }
}(this, function ($, _, ShoppersApiCore, CartQtyBox) {
    return ShoppersApiCore.Class.extend({
        init: function (options) {
            this.$el = $(options.el);
            this.cartQtyBox = new CartQtyBox({
                el: $('[rel="dr-cartQtyBox"]')
            });

            this.listeners();
        },

        listeners: function () {
            this.$el.on("click", '[rel="dr-applyPromoLink"]', function (e) {
                e.stopImmediatePropagation();
                $(document).trigger("dr-applyPromoLink.cart");
            }.bind(this));
            
            this.$el.on("click", '[rel="dr-cartCheckoutLink"]', function (e) {
                e.stopImmediatePropagation();
                this.$el.trigger("dr-cartCheckoutLink.cart");
            }.bind(this));
        }
    });
}));
