var app = {
  popup: (function () {
    var
      popups = [],
      cache = {},
      $currentPopup;

    var _open = function ($popup, afterOpen) {
      var
        $body = $('body'),
        $overlay = $('.popup-overlay');

      $body.setMod('state', 'openedPopup');

      function _step1 () {
        function _step2 () {
          $popup.appendTo('body');
          setTimeout(function () { $popup.setMod('state', 'opened'); }, 100);
          popups.push($popup);

          if ($.isFunction(afterOpen)) {
            afterOpen($popup);
          }
          $popup.trigger('afterOpen');
        }

        if (!$overlay.size()) {
          $overlay = $('<div class="popup-overlay"></div>');
          $body.append($overlay);
          $overlay.fadeIn(300, _step2);
        } else {
          $overlay.fadeIn(300, _step2);
        }
      }

      if ($currentPopup && $currentPopup.size()) {
        $currentPopup.setMod('hidden', 'left');
      }

      _step1();

      $currentPopup = $popup;
    };

    return {
      open: function (id, options) {
        options = $.extend({
          ajaxUrl: false,
          ajaxData: false,
          ajaxRender: false,
          cache: true,
          beforeOpen: false,
          afterOpen: false
        }, options);

        if (!id) {
          throw new Error('Id is require parameter');
        }

        var
          html,
          $popup = $('<div class="popup-wrapper"><table class="popup-container"><tr><td class="popup-inner"></td></tr></table></div>'),
          $popupInner = $('.popup-inner', $popup);

        $popup.data('popup-id', id);

        if ($.isFunction(options.beforeOpen)) {
          options.beforeOpen($popup);
        }
        $popup.trigger('beforeOpen');

        if (options.cache && cache[id]) {
          $('#' + id).html('');
          $popupInner.html(cache[id]);
          _open($popup, options.afterOpen);
        } else {
          if (options.ajaxUrl) {
            $.ajax({
              url: options.ajaxUrl,
              type: 'POST',
              data: options.ajaxData || {},
              success: function (data) {
                if ($.isFunction(options.ajaxRender)) {
                  html = options.ajaxRender(data);
                } else {
                  html = data;
                }

                $popupInner.html(html);
                _open($popup, options.afterOpen);

                cache[id] = html;
              },
              error: function (jqXHR, textStatus){
                throw new Error(textStatus);
              }
            })
          } else {
            var $popupContent = $('#' + id);
            if (!$popupContent.size()) {
              throw new Error('Node not found');
            }

            html = $popupContent.html();
            $popupInner.html(html);
            $popupContent.html('');
            _open($popup, options.afterOpen);

            cache[id] = html;
          }
        }
      },

      close: function (options) {
        if (!popups.length) {
          return false;
        }

        options = $.extend({
          beforeClose: false,
          afterClose: false
        }, options);

        var
          $lastPopup = popups.pop(),
          lastPopupId = $lastPopup.data('popup-id'),
          $lastPopupSource = $('#' + lastPopupId),
          complete = $.Deferred();

        if ($.isFunction(options.beforeClose)) {
          options.beforeClose($lastPopup);
        }
        $lastPopup.trigger('beforeClose');

        $lastPopup.delMod('state', 'opened');

        if ($lastPopup.css('transition-duration') != '0s') {
          $lastPopup.on('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', complete.resolve);
        } else {
          complete.resolve();
        }

        if (popups.length) {
          $currentPopup = popups[popups.length - 1].delMod('hidden', 'left');
        } else {
          $currentPopup = null;
        }

        complete.done(function () {
          if ($.isFunction(options.afterClose)) {
            options.afterClose($lastPopup);
          }
          $lastPopup.trigger('afterClose').remove();
          if ($lastPopupSource.size()) {
            $lastPopupSource.html(cache[lastPopupId]);
          }
          if (!popups.length) {
            $('.popup-overlay').fadeOut(300);
          }
        });
      },

      closeAll: function (options) {
        options = $.extend({
          beforeClose: false,
          afterClose: false
        }, options);

        var complete = $.Deferred();

        $currentPopup.delMod('state', 'opened');

        if ($.isFunction(options.beforeClose)) {
          options.beforeClose(popups);
        }
        for (var i = 0; i < popups.length; i++) {
          popups[i].trigger('beforeClose');
        }

        if ($currentPopup.css('transition-duration') != '0s') {
          $currentPopup.on('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', complete.resolve);
        } else {
          complete.resolve();
        }

        complete.done(function () {
          for (var i = 0; i < popups.length; i++) {
            var $lastPopupSource = $('#' + popups[i].data('popup-id'));
            if ($lastPopupSource.size()) {
              $lastPopupSource.html(cache[popups[i].data('popup-id')]);
            }
            popups[i].trigger('afterClose').remove();
          }
          if ($.isFunction(options.afterClose)) {
            options.afterClose(popups);
          }
          $('.popup-overlay').fadeOut(300);
          popups = [];
          $currentPopup = null;
        });
      },

      getCacheHtml: function (id) {
        return cache[id];
      },

      setCacheHtml: function (id, html) {
        cache[id] = html;
      }
    }
  })(),

  initControls: function () {
    function setDefaultValue($el) {
      return $el.is('select') ? $('option', $el).first().val() : '';
    }

    var
      $controls = $('input, select').not(':disabled, :checkbox, :radio');

    $controls.each(function () {
      var defaultValue = $(this).data('default-value') || setDefaultValue($(this));
      $(this).data('default-value', defaultValue);
      if ($(this).val() != defaultValue) {
        $(this).siblings('.form-control-clear').fadeIn();
      }
    });

    $controls.on('input change', function () {
      var
        $el = $(this),
        val = $el.val(),
        defaultVal = $(this).data('default-value');

      if (val != defaultVal) {
        $el.siblings('.form-control-clear').fadeIn();
      } else {
        $el.siblings('.form-control-clear').fadeOut();
      }
    });

    $controls.siblings('.form-control-clear').on('click', function () {
      var
        $control = $(this).siblings('input, select');

      $control.val($control.data('default-value'));
      $(this).fadeOut();
    });

    $controls.filter('input').inputmask();
  },

  citySubmit: (function () {
    var lock = false;

    return function (form) {
      if (lock) {
        return false;
      }

      lock = true;

      $.ajax({
        url: 'http://cs-dev.ru/blankRequest.php',
        type: 'POST',
        data: $(form).serializeArray(),
        success: function (data) {
          if (data.status) {
            app.popup.closeAll();
            lock = false;
            //TODO fix it
            $('#current-city').html($('label[for=' + $(form).find('input:checked').attr('id') + ']').text());
          }
        },
        error: function (jqXHR, textStatus){
          throw new Error(textStatus);
        }
      })
    }
  })(),

  filter: {
    clear: function () {
      $(document.getElementById('filter-form').elements).not('button, :disabled').each(function () {
        var $el = $(this);

        if ($el.is('input')) {
          if ($el.is(':checkbox, :radio')) {
            $el.prop('checked', false);
          } else {
            $el.val('').siblings('.form-control-clear').fadeOut();
          }
        } else if ($el.is('select')) {
          $el.val($el.find('option').first().val()).siblings('.form-control-clear').fadeOut();
        }
      });
    }
  },

  menu: (function () {
    var
      $body,
      $menu;

    return {
      init: function () {
        $body = $('body');
        $menu = $('#popup-menu');
      },

      open: function () {
        $body.setMod('state', 'openedMenu');
        $menu.setMod('state', 'opened');
      },

      close: function () {
        $body.delMod('state', 'openedMenu');
        $menu.delMod('state', 'opened');
      }
    }
  })(),

  cart: {
    removeItem: function (el) {
      $(el).parent().slideUp();
    }
  }
};

$(function () {
  app.initControls();
  app.menu.init();
});