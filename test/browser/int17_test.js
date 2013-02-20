'use strict';

test('create', function (test) {
  var instances = [
      int17.create()
    , int17.create('foo')
    , int17.create('bar')
    , int17.create('foo')
    , int17.create()
  ];
  helpers.strictEqualOnly(test, 0, [],  instances, 'Non-cached instance was not unique');
  helpers.strictEqualOnly(test, 1, [3], instances, 'Cached instance was unique');
  helpers.strictEqualOnly(test, 2, [],  instances, 'Cached instance was not unique');
  helpers.strictEqualOnly(test, 4, [],  instances, 'Non-cached instance was not unique');
  int17.clearCache();
  test.notStrictEqual(int17.create('foo'), instances[1], 'Cache was not cleared');
});

asyncTest('init:async', 11, function (test) {
  var inst = int17.create()
    , opts = {
          encoding:  'UTF-8'
        , extension: '.js'
        , fallback:  false
        , fileName:  'msgs'
        , folders:   true
        , locale:    ['fr', 'BE']
        , optimize:  false
        , path:      '../fixtures/locales3'
        , validate:  false
      };
  inst.init(opts, function (err, messages) {
    test.ok(!err, 'Error was thrown');
    test.ok(messages, 'No messages were loaded');
    helpers.strictContains(test, inst.messenger, opts, 'Options were not set correctly');
    start();
  });
});

test('init:sync', function (test) {
  var inst = int17.create()
    , opts = {
          encoding:  'UTF-8'
        , extension: '.js'
        , fallback:  false
        , fileName:  'msgs'
        , folders:   true
        , locale:    ['fr', 'BE']
        , optimize:  false
        , path:      '../fixtures/locales3'
        , validate:  false
      };
  inst.initSync(opts);
  test.ok(inst.messenger.messages, 'No messages were loaded');
  helpers.strictContains(test, inst.messenger, opts, 'Options were not set correctly');
});

// TODO: Complete test cases
