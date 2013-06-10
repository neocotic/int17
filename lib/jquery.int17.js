// [int17](http://neocotic.com/int17) 0.3.0  
// Copyright (c) 2013 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/int17>

(function () {

  'use strict';

  // Private variables
  // -----------------

      // Convient shortcuts to the global `jQuery` and `int17` instances.
  var $     = this.jQuery
    , int17 = this.int17
      // Scoped reference to the current instance.
    , i18n  = null;

  // Plugin
  // ------

  // None shall pass!.. unless jQuery has been loaded.
  if (!$) return;

  // Save the previous values of jQuery's `$.int17` and `$.fn.int17` extensions.
  var old   = $.int17
    , oldFn = $.fn.int17;

  // Create and initialize a new instance asynchronously with the specified `options`.  
  // `$.Deferred` and a `callback` function are both supported methods of being notified upon
  // completion of the initialization.  
  // However, if `options` contains `int17`, then that instance will be used.
  $.int17 = function(options, callback) {
    var deferred = $.Deferred();
    if (typeof options === 'object' && options && options.int17) {
      i18n = typeof options.int17 === 'string' ? int17.create(options.int17) : options.int17;
      if (callback) callback(null, i18n);
      deferred.resolve(i18n);
    } else {
      i18n = int17.create();
      i18n.init(options, function (err) {
        if (err) {
          if (callback) callback(err);
          deferred.reject(err);
        } else {
          if (callback) callback(null, i18n);
          deferred.resolve(i18n);
        }
      });
    }
    return deferred.promise();
  };

  // Run the int17 jQuery plugin in *noConflict* mode, returning jQuery's `$.int17` extension to
  // it's previous owner.  
  // Returns a reference to `$.int17`.
  $.int17.noConflict = function() {
    $.int17 = old;
    return this;
  };

  // Traverse the children of each selected element and handle all recognized int17 attributes
  // accordingly.  
  $.fn.int17 = function() {
    return this.each(function () {
      i18n.traverse(this);
    });
  };

  // Run the int17 jQuery plugin in *noConflict* mode, returning jQuery's `$.fn.int17` extension to
  // it's previous owner.  
  // Returns a reference to `$.fn.int17`.
  $.fn.int17.noConflict = function() {
    $.fn.int17 = oldFn;
    return this;
  };

}).call(this);
