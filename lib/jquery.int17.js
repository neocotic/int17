// [int17](http://neocotic.com/int17) 0.3.0  
// Copyright (c) 2013 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/int17>

// TODO: Create unit tests

(function () {

  'use strict';

  // Private variables
  // -----------------

      // Convient shortcuts to the global `jQuery` and `int17` instances.
  var $     = this.jQuery
    , int17 = this.int17
      // Quick reference to core prototype functions.
    , slice = Array.prototype.slice;

  // None shall pass!.. unless jQuery has been loaded.
  if (!$) return;

  // Plugin
  // ------

  // TODO: Document
  // TODO: Add more actions
  var actions = {
    init: function(options) {
      // TODO: Complete
      // TODO: Support named instances
      // TODO: Support async (deferred?)
      int17.create().initSync(options);
      return this;
    }
  };

  // TODO: Document
  $.fn.int17 = function(action) {
    action   = actions[action];
    var args = slice.call(arguments, 1);
    return action ? action.apply(this, args) : this;
  };

}).call(this);
