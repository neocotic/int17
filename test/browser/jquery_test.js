'use strict';

asyncTest('jQuery:callback', 12, function (test) {
  var opts = {
      clean:      true
    , encoding:   'UTF-8'
    , extension:  '.js'
    , fallback:   false
    , fileName:   'msgs'
    , folders:    true
    , ignoreCase: false
    , locale:     ['fr', 'BE']
    , path:       '../fixtures/locales3'
  };

  $.int17(opts, function (err, inst) {
    test.ok(!err, 'Error was thrown');
    test.ok(inst, 'Instance was not created');
    test.ok(inst.config.messages, 'No messages were loaded');
    helpers.strictContains(test, inst.config, opts, 'Options were not set correctly');

    start();
  });
});

asyncTest('jQuery:callback:int17', 2, function (test) {
  var inst = int17.create()
    , opts = {
          extension:  '.js'
        , fileName:   'msgs'
        , folders:    true
        , locale:     ['fr', 'BE']
        , path:       '../fixtures/locales3'
      };

  inst.initSync(opts);
  $.int17({ int17: inst }, function (err, i18n) {
    test.ok(!err, 'Error was thrown');
    test.strictEqual(i18n, inst, 'Instance was not reused');

    start();
  });
});

asyncTest('jQuery:callback:int17:name', 2, function (test) {
  var inst = int17.create('foo')
    , opts = {
          extension:  '.js'
        , fileName:   'msgs'
        , folders:    true
        , locale:     ['fr', 'BE']
        , path:       '../fixtures/locales3'
      };

  inst.initSync(opts);
  $.int17({ int17: 'foo' }, function (err, i18n) {
    test.ok(!err, 'Error was thrown');
    test.strictEqual(i18n, inst, 'Instance was not reused');

    start();
  });
});

asyncTest('jQuery:deferred', 11, function (test) {
  var opts = {
      clean:      true
    , encoding:   'UTF-8'
    , extension:  '.js'
    , fallback:   false
    , fileName:   'msgs'
    , folders:    true
    , ignoreCase: false
    , locale:     ['fr', 'BE']
    , path:       '../fixtures/locales3'
  };

  $.int17(opts).done(function (inst) {
    test.ok(inst, 'Instance was not created');
    test.ok(inst.config.messages, 'No messages were loaded');
    helpers.strictContains(test, inst.config, opts, 'Options were not set correctly');

    start();
  });
});

asyncTest('jQuery:deferred:int17', 1, function (test) {
  var inst = int17.create()
    , opts = {
          extension:  '.js'
        , fileName:   'msgs'
        , folders:    true
        , locale:     ['fr', 'BE']
        , path:       '../fixtures/locales3'
      };

  inst.initSync(opts);
  $.int17({ int17: inst }).done(function (i18n) {
    test.strictEqual(i18n, inst, 'Instance was not reused');

    start();
  });
});

asyncTest('jQuery:deferred:int17:name', 1, function (test) {
  var inst = int17.create('foo')
    , opts = {
          extension:  '.js'
        , fileName:   'msgs'
        , folders:    true
        , locale:     ['fr', 'BE']
        , path:       '../fixtures/locales3'
      };

  inst.initSync(opts);
  $.int17({ int17: 'foo' }).done(function (i18n) {
    test.strictEqual(i18n, inst, 'Instance was not reused');

    start();
  });
});

asyncTest('jQuery.fn', 5, function (test) {
  var reset = helpers.resetter('.test1');

  $.int17({ locale: 'en', path: '../fixtures/locales1' }).done(function () {
    $('#int17 .test1').int17();

    helpers.htmlEqual(test, '.test1 .e1', '<a class="e1" i18n-content="test1">test1m</a>');
    helpers.htmlEqual(test, '.test1 .e2', '<a class="e2" data-i18n-content="test2">' +
      'test2m $1 $1 $2</a>');
    helpers.htmlEqual(test, '.test1 .e3', '<a class="e3" i18n-subs="a1;a2" i18n-content="test2">' +
      'test2m a1 a1 a2</a>');
    helpers.htmlEqual(test, '.test1 .e4', '<a class="e4" data-i18n-subs="a1;a2" ' +
      'i18n-values="title:test2;.style.direction:dir;.innerHTML:test4" title="test2m a1 a1 a2" ' +
      'style="direction: ltr; "><span i18n-content="test1">test1m</span></a>');
    helpers.htmlEqual(test, '.test1 .e5', '<select class="e5" ' +
      'i18n-options="testOpt1:-1;testOpt2;testOpt3"><option value="-1">option1</option>' +
      '<option>option2</option><option>option3</option></select>');

    reset();

    start();
  });
});

asyncTest('jQuery.fn:clean', 5, function (test) {
  var reset = helpers.resetter('.test2');

  $.int17({ clean: true, locale: 'en', path: '../fixtures/locales1' }).done(function () {
    $('#int17 .test2').int17();

    helpers.htmlEqual(test, '.test2 .e1', '<a class="e1">test1m</a>');
    helpers.htmlEqual(test, '.test2 .e2', '<a class="e2">test2m $1 $1 $2</a>');
    helpers.htmlEqual(test, '.test2 .e3', '<a class="e3">test2m a1 a1 a2</a>');
    helpers.htmlEqual(test, '.test2 .e4', '<a class="e4" title="test2m a1 a1 a2" ' +
      'style="direction: ltr; "><span>test1m</span></a>');
    helpers.htmlEqual(test, '.test2 .e5', '<select class="e5">' +
      '<option value="-1">option1</option><option>option2</option><option>option3</option>' +
      '</select>');

    reset();

    start();
  });
});
