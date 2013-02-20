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

asyncTest('init:async', 12, function (test) {
  var inst = int17.create()
    , opts = {
          clean:     true
        , encoding:  'UTF-8'
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
          clean:     true
        , encoding:  'UTF-8'
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

asyncTest('languages:async', 3, function (test) {
  var inst  = int17.create()
    , langs = ['en-GB'];
  inst.init({ locale: 'en-GB', path: '../fixtures/locales1' }, function (err) {
    test.ok(!err, 'Error was thrown');
    inst.languages(function (err, languages) {
      test.ok(!err, 'Error was thrown');
      test.deepEqual(languages, langs, 'Not all languages were detected');
      start();
    });
  });
});

asyncTest('languages:async:folders', 3, function (test) {
  var inst  = int17.create()
    , langs = ['de'];
  inst.init({ folders: true, locale: 'de', path: '../fixtures/locales2' }, function (err) {
    test.ok(!err, 'Error was thrown');
    inst.languages(function (err, languages) {
      test.ok(!err, 'Error was thrown');
      test.deepEqual(languages, langs, 'Not all languages were detected');
      start();
    });
  });
});

asyncTest('languages:async:manual', 3, function (test) {
  var inst  = int17.create()
    , langs = ['ar-EG', 'zh-CN'];
  inst.init({ languages: langs, path: '../fixtures/locales1' }, function (err) {
    test.ok(!err, 'Error was thrown');
    inst.languages(function (err, languages) {
      test.ok(!err, 'Error was thrown');
      test.deepEqual(languages, langs, 'Configured languages should have been used');
      start();
    });
  });
});

asyncTest('languages:async:manual:folders', 3, function (test) {
  var inst  = int17.create()
    , langs = ['ar-EG', 'zh-CN'];
  inst.init({
      folders:   true
    , languages: langs
    , locale:    'de'
    , path:      '../fixtures/locales2'
  }, function (err) {
    test.ok(!err, 'Error was thrown');
    inst.languages(function (err, languages) {
      test.ok(!err, 'Error was thrown');
      test.deepEqual(languages, langs, 'Configured languages should have been used');
      start();
    });
  });
});

asyncTest('languages:async:manual:folders:parent', 7, function (test) {
  var inst  = int17.create()
    , langs = ['de-AT', 'de-CH'];
  inst.init({
      folders:   true
    , languages: ['de'].concat(langs)
    , locale:    'de'
    , path:      '../fixtures/locales2'
  }, function (err) {
    test.ok(!err, 'Error was thrown');
    inst.languages('de', function (err, languages) {
      test.ok(!err, 'Error was thrown');
      test.deepEqual(languages, langs, 'Extended languages should be retrieved');
      inst.languages('de-AT', function (err, languages) {
        test.ok(!err, 'Error was thrown');
        test.deepEqual(languages, [], 'No languages should be retrieved');
        inst.languages('en', function (err, languages) {
          test.ok(!err, 'Error was thrown');
          test.deepEqual(languages, [], 'No languages should be retrieved');
          start();
        });
      });
    });
  });
});

asyncTest('languages:async:parent', 7, function (test) {
  var inst  = int17.create()
    , langs = ['en-GB'];
  inst.init({ locale: 'en-GB', path: '../fixtures/locales1' }, function (err) {
    test.ok(!err, 'Error was thrown');
    inst.languages('en', function (err, languages) {
      test.ok(!err, 'Error was thrown');
      test.deepEqual(languages, langs, 'Extended languages should be retrieved');
      inst.languages('en-GB', function (err, languages) {
        test.ok(!err, 'Error was thrown');
        test.deepEqual(languages, [], 'No languages should be retrieved');
        inst.languages('de', function (err, languages) {
          test.ok(!err, 'Error was thrown');
          test.deepEqual(languages, [], 'No languages should be retrieved');
          start();
        });
      });
    });
  });
});

asyncTest('languages:async:parent:folders', 7, function (test) {
  var inst = int17.create();
  inst.init({ folders: true, locale: 'de', path: '../fixtures/locales2' }, function (err) {
    test.ok(!err, 'Error was thrown');
    inst.languages('de', function (err, languages) {
      test.ok(!err, 'Error was thrown');
      test.deepEqual(languages, [], 'No languages should be retrieved');
      inst.languages('de-AT', function (err, languages) {
        test.ok(!err, 'Error was thrown');
        test.deepEqual(languages, [], 'No languages should be retrieved');
        inst.languages('en', function (err, languages) {
          test.ok(!err, 'Error was thrown');
          test.deepEqual(languages, [], 'No languages should be retrieved');
          start();
        });
      });
    });
  });
});

test('languages:sync', function (test) {
  var inst  = int17.create()
    , langs = ['en-GB'];
  inst.initSync({ locale: 'en-GB', path: '../fixtures/locales1' });
  test.deepEqual(inst.languagesSync(), langs, 'Not all languages were detected');
});

test('languages:sync:folders', function (test) {
  var inst  = int17.create()
    , langs = ['de'];
  inst.initSync({ folders: true, locale: 'de', path: '../fixtures/locales2' });
  test.deepEqual(inst.languagesSync(), langs, 'Not all languages were detected');
});

test('languages:sync:manual', function (test) {
  var inst  = int17.create()
    , langs = ['ar-EG', 'zh-CN'];
  inst.initSync({ languages: langs, path: '../fixtures/locales1' });
  test.deepEqual(inst.languagesSync(), langs, 'Configured languages should have been used');
});

test('languages:sync:manual:folders', function (test) {
  var inst  = int17.create()
    , langs = ['ar-EG', 'zh-CN'];
  inst.initSync({
      folders:   true
    , languages: langs
    , locale:    'de'
    , path:      '../fixtures/locales2'
  });
  test.deepEqual(inst.languagesSync(), langs, 'Configured languages should have been used');
});

test('languages:sync:manual:folders:parent', function (test) {
  var inst  = int17.create()
    , langs = ['de-AT', 'de-CH'];
  inst.initSync({
      folders:   true
    , languages: ['de'].concat(langs)
    , locale:    'de'
    , path:      '../fixtures/locales2'
  });
  test.deepEqual(inst.languagesSync('de'), langs, 'Extended languages should be retrieved');
  test.deepEqual(inst.languagesSync('de-AT'), [], 'No languages should be retrieved');
  test.deepEqual(inst.languagesSync('en'), [], 'No languages should be retrieved');
});

test('languages:sync:parent', function (test) {
  var inst  = int17.create()
    , langs = ['en-GB'];
  inst.initSync({ locale: 'en-GB', path: '../fixtures/locales1' });
  test.deepEqual(inst.languagesSync('en'), langs, 'Extended languages should be retrieved');
  test.deepEqual(inst.languagesSync('en-GB'), [], 'No languages should be retrieved');
  test.deepEqual(inst.languagesSync('de'), [], 'No languages should be retrieved');
});

test('languages:sync:parent:folders', function (test) {
  var inst = int17.create();
  inst.initSync({ folders: true, locale: 'de', path: '../fixtures/locales2' });
  test.deepEqual(inst.languagesSync('de'), [], 'No languages should be retrieved');
  test.deepEqual(inst.languagesSync('de-AT'), [], 'No languages should be retrieved');
  test.deepEqual(inst.languagesSync('en'), [], 'No languages should be retrieved');
});

// TODO: Complete test cases
