'use strict';

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
  helpers.strictEqualOnly(window, 0, [],  instances, 'Non-cached instance was not unique');
  helpers.strictEqualOnly(window, 1, [3], instances, 'Cached instance was unique');
  helpers.strictEqualOnly(window, 2, [],  instances, 'Cached instance was not unique');
  helpers.strictEqualOnly(window, 4, [],  instances, 'Non-cached instance was not unique');
  int17.clearCache();
  notStrictEqual(int17.create('foo'), instances[1], 'Cache was not cleared');
});

// TODO: Complete test cases
