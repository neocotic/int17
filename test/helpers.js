(function () {

  'use strict';

  // Creates a new instance of `Helpers`.
  function Helpers() {}

  // Test that `actual` contains all the same properties of `expected` - with equal values, while
  // it may also contain more.
  Helpers.prototype.contains = function(test, actual, expected, message, strict) {
    message = message ? message + ': ' : '';
    var prop
      , equalMethod = strict ? 'strictEqual' : 'equal';
    for (prop in expected) {
      if (!expected.hasOwnProperty(prop)) continue;
      test[equalMethod](actual[prop], expected[prop], message + 'property[' + prop +
        '] was not as expected');
    }
  };

  // Test that `actual` contains all the same properties of `expected` - with *strictly* equal
  // values, while it may also contain more.
  Helpers.prototype.strictContains = function(test, actual, expected, message, strict) {
    this.contains(test, actual, expected, message, true);
  };

  // Test that the item at `index` within `array` is only equal to those within the `expected`
  // indices.
  Helpers.prototype.equalOnly = function(test, index, expected, array, message, strict) {
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
        test[equalMethod](array[i], array[index], message + 'item[' + i + '] should equal item[' +
          index + ']');
      } else {
        test[notEqualMethod](array[i], array[index], message + 'item[' + i +
          '] should not equal item[' + index + ']');
      }
    }
  };

  // Test that the item at `index` within `array` is only *strictly* equal to those within the
  // `expected` indices.
  Helpers.prototype.strictEqualOnly = function(test, index, expected, array, message) {
    this.equalOnly(test, index, expected, array, message, true);
  };

  // Test that the HTML of the selected element is equal to `expected`.  
  // The HTML compared is the entire HTML comprised of the element's children as well as the
  // element itself.
  Helpers.prototype.htmlEqual = function(test, selector, expected, message) {
    message = message ? message + ': ' : '';
    selector = '#int17 ' + (selector || '');
    var div, i
      , elements = document.querySelectorAll(selector);
    for (i = 0; i < elements.length; i++) {
      div = document.createElement('div');
      div.appendChild(elements[i]);
      test.equal(div.innerHTML, expected, message + 'element[' + i + ']\'s HTML not as expected');
    }
  };

  // Expose an instance of `Helpers` for node.js or the browser.
  if (typeof module === 'object' && module.exports) {
    module.exports = new Helpers();
  } else {
    this.helpers   = new Helpers();
  }

}).call(this);