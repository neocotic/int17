(function () {

  'use strict';

  // Creates a new instance of `Helpers`.
  function Helpers() {}

  // Test that the item at `index` within `array` is only equal to those within the `expected`
  // indices.
  Helpers.prototype.equalOnly = function(ctx, index, expected, array, message, strict) {
    message = message ? message + ': ' : '';
    var i, isExpected, j
      , equalMethod    = strict ? 'strictEqual' : 'equal'
      , notEqualMethod = strict ? 'notStrictEqual' : 'notEqual';
    for (i = 0; i < array.length; i++) {
      isExpected = index === i;
      if (!isExpected) {
        for (j = 0; j < expected.length; j++) {
          if (expected[j] === i) {
            isExpected = true;
            break;
          }
        }
      }
      if (isExpected) {
        ctx[equalMethod](array[i], array[index], message + 'item[' + i + '] should equal item[' +
          index + ']');
      } else {
        ctx[notEqualMethod](array[i], array[index], message + 'item[' + i +
          '] should not equal item[' + index + ']');
      }
    }
  };

  // Test that the item at `index` within `array` is only *strictly* equal to those within the
  // `expected` indices.
  Helpers.prototype.strictEqualOnly = function(ctx, index, expected, array, message) {
    this.equalOnly(ctx, index, expected, array, message, true);
  };

  // Expose an instance of `Helpers` for node.js or the browser.
  if (typeof module === 'object' && module.exports) {
    module.exports = new Helpers();
  } else {
    this.helpers   = new Helpers();
  }

}).call(this);