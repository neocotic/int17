'use strict';

// Helper functions
// ----------------

function equalOnly(index, expected, array, message, strict) {
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
      window[equalMethod](array[i], array[index], message + 'item[' + i + '] should equal item[' +
        index + ']');
    } else {
      window[notEqualMethod](array[i], array[index], message + 'item[' + i +
        '] should not equal item[' + index + ']');
    }
  }
}

function strictEqualOnly(index, expected, array, message) {
  equalOnly(index, expected, array, message, true);
}

// Test cases
// ----------

test('create', function () {
  var instances = [
      int17.create()
    , int17.create('foo')
    , int17.create('bar')
    , int17.create('foo')
    , int17.create()
  ];
  strictEqualOnly(0, [],  instances, 'Non-cached instance was not unique');
  strictEqualOnly(1, [3], instances, 'Cached instance was unique');
  strictEqualOnly(2, [],  instances, 'Cached instance was not unique');
  strictEqualOnly(4, [],  instances, 'Non-cached instance was not unique');
  int17.clearCache();
  notStrictEqual(int17.create('foo'), instances[1], 'Cache was not cleared');
});

// TODO: Complete test cases
