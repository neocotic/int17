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

// TODO: Test parent filtering
exports.languages = {
    testAsync: function(test) {
      var inst  = int17.create()
        , langs = ['en', 'en-GB', 'fr-FR'];
      test.expect(3);
      inst.init({ path: './test/fixtures/locales2' }, function (err) {
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
        , langs = ['en-US', 'fr-BE'];
      test.expect(3);
      inst.init({ languages: langs, path: './test/fixtures/locales2' }, function (err) {
        test.ifError(err);
        inst.languages(function (err, languages) {
          test.ifError(err);
          test.deepEqual(languages, langs, 'Configured languages should have been used');
          test.done();
        });
      });
    }
  , testSync: function(test) {
      var inst  = int17.create()
        , langs = ['en', 'en-GB', 'fr-FR'];
      inst.initSync({ path: './test/fixtures/locales2' });
      test.deepEqual(inst.languagesSync(), langs, 'Not all languages were detected');
      test.done();
    }
  , testSyncManual: function(test) {
      var inst  = int17.create()
        , langs = ['en-US', 'fr-BE'];
      inst.initSync({ languages: langs, path: './test/fixtures/locales2' });
      test.deepEqual(inst.languagesSync(), langs, 'Configured languages should have been used');
      test.done();
    }
};

// TODO: Complete test cases
