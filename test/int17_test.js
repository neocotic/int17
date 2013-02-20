'use strict';

var helpers = require('./helpers')
  , int17   = require('../lib/int17');

exports.testAll = function(test) {
  var inst = int17.create();
  inst.initSync({ path: './test/fixtures/locales1' });
  test.deepEqual(inst.all([
      'test1'
    , 'test2'
    , 'test3'
  ]), [
      'test1m'
    , 'test2m $1 $1 $2'
    , 'test3m $1 $1 $2 p1c p2c $1 p3c'
  ]);
  test.deepEqual(inst.all([
      'test1'
    , 'test2'
    , { name: 'test3' }
    , { name: 'test3', args: [] }
    , { name: 'test3', args: ['a1b', 'a2b'] }
  ], 'a1', 'a2'), [
      'test1m'
    , 'test2m a1 a1 a2'
    , 'test3m a1 a1 a2 p1c p2c a1 p3c'
    , 'test3m $1 $1 $2 p1c p2c $1 p3c'
    , 'test3m a1b a1b a2b p1c p2c a1b p3c'
  ]);
  test.deepEqual(inst.all([
      'test1'
    , 'test2'
    , 'test3'
    , { name: 'test3', args: ['a1', 'a2'] }
  ]), [
      'test1m'
    , 'test2m $1 $1 $2'
    , 'test3m $1 $1 $2 p1c p2c $1 p3c'
    , 'test3m a1 a1 a2 p1c p2c a1 p3c'
  ]);
  test.done();
};

exports.testCreate = function(test) {
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
  test.done();
};

exports.testExpress = function(test) {
  var app  = {}
    , inst = int17.create();
  test.expect(4);
  app.dynamicHelpers = function(helpers) {
    test.ok(helpers, 'Helpers should be provided');
    test.strictEqual(helpers.int17, inst, 'Helpers should contain reference to instance');
  };
  app.use = function(fn) {
    var req = {}
      , res = { locals: {} };
    fn(req, res, function () {
      test.strictEqual(req.int17, inst, 'Request should contain reference to instance');
      test.strictEqual(res.locals.int17, inst,
        'Response local variables should contain reference to instance');
    });
  };
  inst.express(app);
  test.done();
};

exports.testGet = function(test) {
  var inst = int17.create();
  inst.initSync({ path: './test/fixtures/locales1' });
  test.equal(inst.get('test1'), 'test1m');
  test.equal(inst.get('test2'), 'test2m $1 $1 $2');
  test.equal(inst.get('test2', 'a1', 'a2'), 'test2m a1 a1 a2');
  test.equal(inst.get('test3'), 'test3m $1 $1 $2 p1c p2c $1 p3c');
  test.equal(inst.get('test3', 'a1', 'a2'), 'test3m a1 a1 a2 p1c p2c a1 p3c');
  test.done();
};

exports.testLocale = function(test) {
  var i
    , inst    = int17.create()
    , locales = ['en', 'en-GB'];
  for (i = 0; i < locales.length; i++) {
    inst.initSync({ locale: locales[i], path: './test/fixtures/locales1' });
    test.equal(inst.locale(), locales[i], 'Locale not as expected');
  }
  test.done();
};

exports.testMap = function(test) {
  var inst = int17.create();
  inst.initSync({ path: './test/fixtures/locales1' });
  test.deepEqual(inst.map([
      'test1'
    , 'test2'
    , 'test3'
  ]), {
      test1: 'test1m'
    , test2: 'test2m $1 $1 $2'
    , test3: 'test3m $1 $1 $2 p1c p2c $1 p3c'
  });
  test.deepEqual(inst.map([
      'test1'
    , 'test2'
    , { name: 'test3' }
    , { name: 'test3', args: [] }
    , { name: 'test3', args: ['a1b', 'a2b'] }
  ], 'a1', 'a2'), {
      test1: 'test1m'
    , test2: 'test2m a1 a1 a2'
    , test3: 'test3m a1b a1b a2b p1c p2c a1b p3c'
  });
  test.deepEqual(inst.map([
      { name: 'test3', args: [] }
    , { name: 'test3' }
  ], 'a1', 'a2'), {
    test3: 'test3m a1 a1 a2 p1c p2c a1 p3c'
  });
  test.deepEqual(inst.map([
      { name: 'test3' }
    , { name: 'test3', args: [] }
  ], 'a1', 'a2'), {
    test3: 'test3m $1 $1 $2 p1c p2c $1 p3c'
  });
  test.deepEqual(inst.map([
    { name: 'test3', args: ['a1', 'a2'] }
  ]), {
    test3: 'test3m a1 a1 a2 p1c p2c a1 p3c'
  });
  test.done();
};

exports.init = {
    testAsync: function(test) {
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
            , path:      './test/fixtures/locales3'
            , validate:  false
          };
      test.expect(12);
      inst.init(opts, function (err, messages) {
        test.ifError(err);
        test.ok(messages, 'No messages were loaded');
        helpers.strictContains(test, inst.messenger, opts, 'Options were not set correctly');
        test.done();
      });
    }
  , testSync: function(test) {
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
            , path:      './test/fixtures/locales3'
            , validate:  false
          };
      inst.initSync(opts);
      test.ok(inst.messenger.messages, 'No messages were loaded');
      helpers.strictContains(test, inst.messenger, opts, 'Options were not set correctly');
      test.done();
    }
};

exports.languages = {
    testAsync: function(test) {
      var inst  = int17.create()
        , langs = ['en', 'en-GB', 'en-US', 'fr-BE'];
      test.expect(3);
      inst.init({ path: './test/fixtures/locales1' }, function (err) {
        test.ifError(err);
        inst.languages(function (err, languages) {
          test.ifError(err);
          test.deepEqual(languages, langs, 'Not all languages were detected');
          test.done();
        });
      });
    }
  , testAsyncFolders: function(test) {
      var inst  = int17.create()
        , langs = ['de', 'de-AT', 'de-CH', 'pt-BR'];
      test.expect(3);
      inst.init({ folders: true, locale: 'de', path: './test/fixtures/locales2' }, function (err) {
        test.ifError(err);
        inst.languages(function (err, languages) {
          test.ifError(err);
          test.deepEqual(languages, langs, 'Not all languages were detected');
          test.done();
        });
      });
    }
  , testAsyncManual: function(test) {
      var inst  = int17.create()
        , langs = ['ar-EG', 'zh-CN'];
      test.expect(3);
      inst.init({ languages: langs, path: './test/fixtures/locales1' }, function (err) {
        test.ifError(err);
        inst.languages(function (err, languages) {
          test.ifError(err);
          test.deepEqual(languages, langs, 'Configured languages should have been used');
          test.done();
        });
      });
    }
  , testAsyncManualFolders: function(test) {
      var inst  = int17.create()
        , langs = ['ar-EG', 'zh-CN'];
      test.expect(3);
      inst.init({
          folders:   true
        , languages: langs
        , locale:    'de'
        , path:      './test/fixtures/locales2'
      }, function (err) {
        test.ifError(err);
        inst.languages(function (err, languages) {
          test.ifError(err);
          test.deepEqual(languages, langs, 'Configured languages should have been used');
          test.done();
        });
      });
    }
  , testAsyncParent: function(test) {
      var inst  = int17.create()
        , langs = ['en-GB', 'en-US'];
      test.expect(7);
      inst.init({ path: './test/fixtures/locales1' }, function (err) {
        test.ifError(err);
        inst.languages('en', function (err, languages) {
          test.ifError(err);
          test.deepEqual(languages, langs, 'Extended languages should be retrieved');
          inst.languages('en-GB', function (err, languages) {
            test.ifError(err);
            test.deepEqual(languages, [], 'No languages should be retrieved');
            inst.languages('de', function (err, languages) {
              test.ifError(err);
              test.deepEqual(languages, [], 'No languages should be retrieved');
              test.done();
            });
          });
        });
      });
    }
  , testAsyncParentFolders: function(test) {
      var inst  = int17.create()
        , langs = ['de-AT', 'de-CH'];
      test.expect(7);
      inst.init({ folders: true, locale: 'de', path: './test/fixtures/locales2' }, function (err) {
        test.ifError(err);
        inst.languages('de', function (err, languages) {
          test.ifError(err);
          test.deepEqual(languages, langs, 'Extended languages should be retrieved');
          inst.languages('de-AT', function (err, languages) {
            test.ifError(err);
            test.deepEqual(languages, [], 'No languages should be retrieved');
            inst.languages('en', function (err, languages) {
              test.ifError(err);
              test.deepEqual(languages, [], 'No languages should be retrieved');
              test.done();
            });
          });
        });
      });
    }
  , testSync: function(test) {
      var inst  = int17.create()
        , langs = ['en', 'en-GB', 'en-US', 'fr-BE'];
      inst.initSync({ path: './test/fixtures/locales1' });
      test.deepEqual(inst.languagesSync(), langs, 'Not all languages were detected');
      test.done();
    }
  , testSyncFolders: function(test) {
      var inst  = int17.create()
        , langs = ['de', 'de-AT', 'de-CH', 'pt-BR'];
      inst.initSync({ folders: true, locale: 'de', path: './test/fixtures/locales2' });
      test.deepEqual(inst.languagesSync(), langs, 'Not all languages were detected');
      test.done();
    }
  , testSyncManual: function(test) {
      var inst  = int17.create()
        , langs = ['ar-EG', 'zh-CN'];
      inst.initSync({ languages: langs, path: './test/fixtures/locales1' });
      test.deepEqual(inst.languagesSync(), langs, 'Configured languages should have been used');
      test.done();
    }
  , testSyncManualFolders: function(test) {
      var inst  = int17.create()
        , langs = ['ar-EG', 'zh-CN'];
      inst.initSync({
          folders:   true
        , languages: langs
        , locale:    'de'
        , path:      './test/fixtures/locales2'
      });
      test.deepEqual(inst.languagesSync(), langs, 'Configured languages should have been used');
      test.done();
    }
  , testSyncParent: function(test) {
      var inst  = int17.create()
        , langs = ['en-GB', 'en-US'];
      inst.initSync({ path: './test/fixtures/locales1' });
      test.deepEqual(inst.languagesSync('en'), langs, 'Extended languages should be retrieved');
      test.deepEqual(inst.languagesSync('en-GB'), [], 'No languages should be retrieved');
      test.deepEqual(inst.languagesSync('de'), [], 'No languages should be retrieved');
      test.done();
    }
  , testSyncParentFolders: function(test) {
      var inst  = int17.create()
        , langs = ['de-AT', 'de-CH'];
      inst.initSync({ folders: true, locale: 'de', path: './test/fixtures/locales2' });
      test.deepEqual(inst.languagesSync('de'), langs, 'Extended languages should be retrieved');
      test.deepEqual(inst.languagesSync('de-AT'), [], 'No languages should be retrieved');
      test.deepEqual(inst.languagesSync('en'), [], 'No languages should be retrieved');
      test.done();
    }
};
