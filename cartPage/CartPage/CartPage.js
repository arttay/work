
         /**
         * @module Shopper/Cart
         *
         * @example <caption>Implementation html</caption> {@lang XML}
         * <div id="minimalCart" class="container-fluid" rel="dr-cartPage">
         * </div>
         *
         * @example <caption>Implementation Javascript</caption>
         *   new Cart({
         *      siteId: '{siteId}',
         *       el: $('[rel="dr-cartPage"]')
         *  });
         */
(function (root, factory) {
    if ('function' === typeof define && define.amd) {
        define([
            'jquery',
            'underscore',
            'ShoppersApiCore',
            'CartPage/ShoppingCart/ShoppingCart'
        ], factory);
    }
}(this, function ($, _, ShoppersApiCore, ShoppingCart) {
    return ShoppersApiCore.Class.extend({
        init: function (options) {

        
            this.$el = $(options.el);
            this.$cartContents = this.$el.find(".cartContents");
            this.siteId = options.siteId;

            this.shopingCart = new ShoppingCart({
                el: this.$el
            });
            this.listeners();

            this.getTotalItemsInCart();
        },
        listeners: function () {
            /*
                This.$el may have multiple instances and thus events may be triggered multiple times.
                Assigning the listener to the document level fixes this issue
            */
            $(document).on("dr-refreshCartQty.cart", function (e, obj) {
                var params      = {itemId: obj.itemId, itemCount: obj.itemCount},
                    url         = "/" + this.siteId + "/cart/update";

                if (parseInt(obj.itemCount) === 0) {
                    $(document).trigger("dr-removeCartQty.cart", [obj.itemId]);
                } else {
                    this.ajax("POST", url, JSON.stringify(params)).then(function (data) {
                        this.updateItemPrice(data.lineItems.lineItem);
                        this.updateSubTotal(data.summary.subtotal.formattedValue);
                        this.updateTotalItemsInCartText();
                    }.bind(this));
                }
            }.bind(this));

            $(document).on("dr-removeCartQty.cart", function (e, element) {

                var itemId,
                    url         = "/" + this.siteId + "/cart/removeLineItem";
                element.currentTarget === undefined ? itemId = element : itemId = $(element.currentTarget).data("lineitemid");

                this.ajax("POST", url, JSON.stringify({itemId: itemId})).then(function (data) {
                    if (typeof data === "string") {
                        //assuming the cart is empty, rendering an empty cart template
                        this.$cartContents.empty().append(data);
                    } else {
                        this.removeLineItem(itemId);
                        this.updateSubTotal(data.summary.total.formattedValue);
                    }
                    this.updateTotalItemsInCartText();
                }.bind(this));
            }.bind(this));

            $(document).on("dr-applyPromoLink.cart", function () {
                var promoCode = $("#promotions").val(),
                    url         = "/" + this.siteId + "/cart/applyPromoCode";

                if (this.validateInput(promoCode)) {
                    this.ajax("POST", url, JSON.stringify({promoCode: promoCode})).then(function (data) {
                        if (data.errors || data.inValidPromoCode) {
                            this.promoCodeError($("#promotions"), "Please enter valid promo code");
                        } else {
                            this.updateItemPrice(data.lineItems.lineItem);
                            this.updateSubTotal(data.summary.subtotal.formattedValue);
                        }
                    }.bind(this));
                } else {
                    this.promoCodeError($("#promotions"), "Please enter valid promo code");//todo: error message should not be hard coded.
                }
            }.bind(this));
        },

        ajax: function (method, route, data) {
            //todo: rename ajax to drAjax in all places
            return $.ajax({
                url: route,
                method: method,
                contentType: 'application/json',
                data: data
            })
            .fail(function (jqXhr, errorTxt, errorThrown) {
                console.log(jqXhr);
                throw new Error("Ajax Error");
            });
        },

        promoCodeError: function ($element, msg) {
            $element.parent().addClass("has-error");
            $element.val('').attr("placeholder", msg);
        },

        /**
         * Validates a text input box
         *
         * @param {Object|String}
         * @returns {Boolean}
         */
        validateInput: function (input) {
            if (input instanceof $) {
                if (input.is(":empty") || input.val() === '') {
                    return false;
                } else {
                    return true;
                }
            } else {
                if (input === '' || input.length === 0) {
                    return false;
                } else {
                    return true;
                }
            }
        },

        updateItemPrice: function (data) {
            var self = this;
            data.forEach(function (item) {
                var regPrice = {
                    formated: item.price.listPriceWithQuantity.formattedValue,
                    nonFormated: item.price.listPriceWithQuantity.value
                };

                var salePrice = {
                    formated: item.price.salePriceWithQuantity.formattedValue,
                    nonFormated: item.price.salePriceWithQuantity.value
                }

                if (regPrice.nonFormated > salePrice.nonFormated) {
                    //has a sale
                    var $siblings = self.$cartContents.find("[data-lineitemid='" + item.id + "']").siblings();
                    $siblings.find("[rel='cartSalePrice']").text(regPrice.formated);
                    $siblings.find("[rel='cartRegPrice']").text(salePrice.formated);
                } else {
                    self.$cartContents.find("[data-lineitemid='" + item.id + "']").siblings().find(".cartRegPrice").text(salePrice.formated);
                }
            });
        },

        updateSubTotal: function (price) {
           this.$cartContents.find("[rel='cartSubTotal']").text(price)
        },

        removeLineItem: function (lineItem) {
            this.$cartContents.find("[data-lineitem='" + lineItem + "']").remove();
        },

        /**
         * Gets the total number of items in cart
         *
         * @returns {Integer}
         */
        getTotalItemsInCart: function () {
            var elements = this.$el.find('[rel="dr-cartQtyBox"]').find("input");
            var count = 0;
            _.each(elements, function (item) {
                count += parseInt(item.value);
            });
            return count;
        },

        /**
         * Updates the text for the minicart of how many items are in the cart
         *
         */
        updateTotalItemsInCartText: function () {
            $(".dr_cartSummaryItemCount").text(this.getTotalItemsInCart()); //todo: is there a better way to do this?
        }
    });
}));
