'use strict';

var slice = Array.prototype.slice;

test('attribute', function (test) {
  var inst  = int17.create()
    , reset = helpers.resetter('.test3');
  inst.initSync({ locale: 'en', path: '../fixtures/locales1' });
  inst.attribute('#int17 .test3 .e2', 'title', 'test1');
  helpers.htmlEqual(test, '.test3 .e2', '<a class="e2" title="test1m"></a>');
  reset();
  inst.attribute('#int17 .test3 .e2', 'title', 'test2');
  helpers.htmlEqual(test, '.test3 .e2', '<a class="e2" title="test2m $1 $1 $2"></a>');
  reset();
  inst.attribute('#int17 .test3 .e2', 'title', 'test2', 'a1', 'a2');
  helpers.htmlEqual(test, '.test3 .e2', '<a class="e2" title="test2m a1 a1 a2"></a>');
  reset();
});

test('content', function (test) {
  var inst  = int17.create()
    , reset = helpers.resetter('.test3');
  inst.initSync({ locale: 'en', path: '../fixtures/locales1' });
  inst.content('#int17 .test3 .e1', 'test1');
  helpers.htmlEqual(test, '.test3 .e1', '<a class="e1">test1m</a>');
  reset();
  inst.content('#int17 .test3 .e1', 'test2');
  helpers.htmlEqual(test, '.test3 .e1', '<a class="e1">test2m $1 $1 $2</a>');
  reset();
  inst.content('#int17 .test3 .e1', 'test2', 'a1', 'a2');
  helpers.htmlEqual(test, '.test3 .e1', '<a class="e1">test2m a1 a1 a2</a>');
  reset();
});

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
  inst.init(opts, function (err) {
    test.ok(!err, 'Error was thrown');
    test.ok(inst.messenger.messages, 'No messages were loaded');
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

test('options', function (test) {
  var inst  = int17.create()
    , reset = helpers.resetter('.test3');
  inst.initSync({ locale: 'en', path: '../fixtures/locales1' });
  inst.options('#int17 .test3 .e4', ['testOpt1', 'testOpt2', 'testOpt3']);
  helpers.htmlEqual(test, '.test3 .e4', '<select class="e4"><option>option1</option>' +
    '<option>option2</option><option>option3</option></select>');
  reset();
  inst.options('#int17 .test3 .e5', [
      'testOpt1'
    , { name: 'testOpt2' }
    , { name: 'testOpt3', value: -1 }
  ]);
  helpers.htmlEqual(test, '.test3 .e5', '<select class="e5"><option>option1</option>' +
    '<option>option2</option><option value="-1">option3</option></select>');
  reset();
  inst.options('#int17 .test3 .e6', [
      { name: 'test2' }
    , { name: 'test2', subs: [] }
    , { name: 'test2', subs: ['a1b', 'a2b'], value: -1 }
  ], 'a1', 'a2');
  helpers.htmlEqual(test, '.test3 .e6', '<select class="e6"><option>test2m a1 a1 a2</option>' +
    '<option>test2m $1 $1 $2</option><option value="-1">test2m a1b a1b a2b</option></select>');
  reset();
});

test('property', function (test) {
  var inst  = int17.create()
    , reset = helpers.resetter('.test3');
  inst.initSync({ locale: 'en', path: '../fixtures/locales1' });
  inst.property('#int17 .test3 .e3', 'title', 'test1');
  helpers.htmlEqual(test, '.test3 .e3', '<a class="e3" title="test1m"></a>');
  reset();
  inst.property('#int17 .test3 .e3', 'title', 'test2');
  helpers.htmlEqual(test, '.test3 .e3', '<a class="e3" title="test2m $1 $1 $2"></a>');
  reset();
  inst.property('#int17 .test3 .e3', 'title', 'test2', 'a1', 'a2');
  helpers.htmlEqual(test, '.test3 .e3', '<a class="e3" title="test2m a1 a1 a2"></a>');
  reset();
  inst.property('#int17 .test3 .e3', 'innerHTML', 'test4');
  helpers.htmlEqual(test, '.test3 .e3',
    '<a class="e3"><span int17-content="test1">test1m</span></a>');
  reset();
  inst.property('#int17 .test3 .e3', 'style.direction', 'dir');
  var elements = slice.call(document.querySelectorAll('#int17 .test3 .e3'));
  elements.forEach(function (element, index) {
    test.equal(element.style.direction, 'ltr', 'element[' + index + ']\'s style not as expected');
  });
  reset();
});

test('traverse', function (test) {
  var inst  = int17.create()
    , reset = helpers.resetter('.test1');
  inst.initSync({ locale: 'en', path: '../fixtures/locales1' });
  inst.traverse('#int17 .test1');
  helpers.htmlEqual(test, '.test1 .e1', '<a class="e1" int17-content="test1">test1m</a>');
  helpers.htmlEqual(test, '.test1 .e2', '<a class="e2" data-int17-content="test2">' +
    'test2m $1 $1 $2</a>');
  helpers.htmlEqual(test, '.test1 .e3', '<a class="e3" int17-subs="a1;a2" int17-content="test2">' +
    'test2m a1 a1 a2</a>');
  helpers.htmlEqual(test, '.test1 .e4', '<a class="e4" data-int17-subs="a1;a2" ' +
    'int17-values="title:test2;.style.direction:dir;.innerHTML:test4" title="test2m a1 a1 a2" ' +
    'style="direction: ltr; "><span int17-content="test1">test1m</span></a>');
  helpers.htmlEqual(test, '.test1 .e5', '<select class="e5" ' +
    'int17-options="testOpt1:-1;testOpt2;testOpt3"><option value="-1">option1</option>' +
    '<option>option2</option><option>option3</option></select>');
  reset();
});

test('traverse:clean', function (test) {
  var inst  = int17.create()
    , reset = helpers.resetter('.test2');
  inst.initSync({ clean: true, locale: 'en', path: '../fixtures/locales1' });
  inst.traverse(document.querySelector('#int17 .test2'));
  helpers.htmlEqual(test, '.test2 .e1', '<a class="e1">test1m</a>');
  helpers.htmlEqual(test, '.test2 .e2', '<a class="e2">test2m $1 $1 $2</a>');
  helpers.htmlEqual(test, '.test2 .e3', '<a class="e3">test2m a1 a1 a2</a>');
  helpers.htmlEqual(test, '.test2 .e4', '<a class="e4" title="test2m a1 a1 a2" ' +
    'style="direction: ltr; "><span>test1m</span></a>');
  helpers.htmlEqual(test, '.test2 .e5', '<select class="e5"><option value="-1">option1</option>' +
    '<option>option2</option><option>option3</option></select>');
  reset();
});
