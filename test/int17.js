'use strict';

var int17 = require('../lib/int17.js');

function equalOnly(test, index, expected, array, message) {
  message = message ? message + ': ' : '';
  var i, isExpected, j;
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
      test.equal(array[i], array[index], message + 'item[' + i + '] should equal item[' + index +
        ']');
    } else {
      test.notEqual(array[i], array[index], message + 'item[' + i + '] should not equal item[' +
        index + ']');
    }
  }
}

exports.testCreate = function(test) {
  var instances = [
      int17.create()
    , int17.create('foo')
    , int17.create('bar')
    , int17.create('foo')
    , int17.create()
  ];
  equalOnly(test, 0, [],  instances, 'Non-cached instance was not unique');
  equalOnly(test, 1, [3], instances, 'Cached instance was unique');
  equalOnly(test, 2, [],  instances, 'Cached instance was not unique');
  equalOnly(test, 4, [],  instances, 'Non-cached instance was not unique');
  int17.clearCache();
  test.notEqual(int17.create('foo'), instances[1], 'Cache was not cleared');
  test.done();
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

// TODO: Complete test cases
