(function () {

  'use strict';

  // Quick reference to core prototypes.
  var slice = Array.prototype.slice;

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
    var isExpected
      , equalMethod    = strict ? 'strictEqual' : 'equal'
      , notEqualMethod = strict ? 'notStrictEqual' : 'notEqual';
    array.forEach(function (value, i) {
      isExpected = index === i;
      if (!isExpected) {
        expected.forEach(function (value, j) {
          if (value === i) {
            isExpected = true;
          }
        });
      }
      if (isExpected) {
        test[equalMethod](value, array[index], message + 'item[' + i + '] should equal item[' +
          index + ']');
      } else {
        test[notEqualMethod](value, array[index], message + 'item[' + i +
          '] should not equal item[' + index + ']');
      }
    });
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
    selector = '#int17 ' + (selector || '');
    message  = message ? message + ': ' : '';
    var elements = slice.call(document.querySelectorAll(selector));
    elements.forEach(function (element, index) {
      var div = document.createElement('div');
      div.appendChild(element.cloneNode(true));
      test.equal(div.innerHTML, expected, message + 'element[' + index +
        ']\'s HTML not as expected');
    });
  };

  // Return a function to allow the selected elements to have their `innerHTML` reset to the value
  // when **this function** was first called.
  Helpers.prototype.resetter = function(selector) {
    selector = '#int17 ' + (selector || '');
    var elements = slice.call(document.querySelectorAll(selector))
      , html     = [];
    elements.forEach(function (element, index) {
      html.push(element.innerHTML);
    });
    return function () {
      elements.forEach(function (element, index) {
        element.innerHTML = html[index];
      });
    };
  }

  // Expose an instance of `Helpers` for node.js or the browser.
  if (typeof module === 'object' && module.exports) {
    module.exports = new Helpers();
  } else {
    this.helpers   = new Helpers();
  }

}).call(this);